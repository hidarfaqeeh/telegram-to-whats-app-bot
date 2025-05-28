import { EventEmitter } from "events"
import { whatsappManager } from "./whatsapp-setup"
import { saveMessage, saveGroups, addLog } from "./supabase-simple"

interface BotConfig {
  telegram: {
    token: string
    channelId: string
  }
  whatsapp: {
    delays: {
      min: number
      max: number
      betweenGroups: number
    }
  }
  security: {
    maxMessagesPerHour: number
    blockedWords: string[]
  }
}

interface BotStats {
  isRunning: boolean
  totalForwarded: number
  totalErrors: number
  uptime: number
  lastActivity: Date | null
  messagesThisHour: number
}

export class SimpleTelegramWhatsAppBot extends EventEmitter {
  private config: BotConfig
  private stats: BotStats
  private startTime: Date | null = null
  private messageQueue: any[] = []
  private isProcessing = false
  private hourlyMessageCount = 0
  private lastHourReset: Date = new Date()

  constructor(config: BotConfig) {
    super()
    this.config = config
    this.stats = {
      isRunning: false,
      totalForwarded: 0,
      totalErrors: 0,
      uptime: 0,
      lastActivity: null,
      messagesThisHour: 0,
    }
  }

  async initialize(): Promise<boolean> {
    try {
      console.log("🤖 تهيئة البوت...")

      // Check if WhatsApp is connected
      if (!whatsappManager.isConnected()) {
        console.log("⚠️ واتساب غير متصل - محاولة الاتصال...")
        const connected = await whatsappManager.connect()
        if (!connected) {
          console.error("❌ فشل في الاتصال بواتساب")
          return false
        }
      }

      // Set up event listeners
      this.setupEventListeners()

      // Start the bot
      this.stats.isRunning = true
      this.startTime = new Date()

      console.log("✅ تم تهيئة البوت بنجاح")
      await addLog("info", "تم بدء تشغيل البوت", { config: this.config })

      return true
    } catch (error) {
      console.error("❌ خطأ في تهيئة البوت:", error)
      await addLog("error", "فشل في تهيئة البوت", { error: error instanceof Error ? error.message : "خطأ غير معروف" })
      return false
    }
  }

  private setupEventListeners(): void {
    // WhatsApp event listeners
    whatsappManager.on("message_sent", (data) => {
      this.stats.totalForwarded++
      this.stats.lastActivity = new Date()
      this.emit("message_forwarded", data)
    })

    whatsappManager.on("message_failed", (data) => {
      this.stats.totalErrors++
      this.emit("message_failed", data)
    })

    whatsappManager.on("disconnected", () => {
      console.log("⚠️ انقطع الاتصال بواتساب")
      this.emit("whatsapp_disconnected")
    })
  }

  async processMessage(telegramMessage: any): Promise<void> {
    try {
      // Check rate limiting
      if (!this.checkRateLimit()) {
        console.log("⚠️ تم تجاوز الحد الأقصى للرسائل في الساعة")
        return
      }

      // Check for blocked words
      if (this.isMessageBlocked(telegramMessage.text || "")) {
        console.log("⚠️ الرسالة تحتوي على كلمات محظورة")
        await addLog("warning", "رسالة محظورة", { message: telegramMessage.text })
        return
      }

      // Get WhatsApp groups
      const groups = await whatsappManager.getGroups()
      const enabledGroups = groups.filter((g) => g.isAdmin) // Only send to groups where bot is admin

      if (enabledGroups.length === 0) {
        console.log("⚠️ لا توجد مجموعات متاحة للإرسال")
        return
      }

      // Add to queue
      this.messageQueue.push({
        telegramMessage,
        targetGroups: enabledGroups,
        timestamp: new Date(),
      })

      // Process queue if not already processing
      if (!this.isProcessing) {
        this.processQueue()
      }
    } catch (error) {
      console.error("❌ خطأ في معالجة الرسالة:", error)
      this.stats.totalErrors++
      await addLog("error", "خطأ في معالجة الرسالة", {
        error: error instanceof Error ? error.message : "خطأ غير معروف",
      })
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.messageQueue.length === 0) {
      return
    }

    this.isProcessing = true

    try {
      while (this.messageQueue.length > 0) {
        const item = this.messageQueue.shift()
        if (!item) continue

        await this.forwardMessageToGroups(item.telegramMessage, item.targetGroups)

        // Wait between messages
        const delay = this.calculateDelay(item.targetGroups.length)
        await this.sleep(delay)
      }
    } catch (error) {
      console.error("❌ خطأ في معالجة الطابور:", error)
    } finally {
      this.isProcessing = false
    }
  }

  private async forwardMessageToGroups(telegramMessage: any, groups: any[]): Promise<void> {
    const results: any[] = []

    for (const group of groups) {
      try {
        let success = false

        if (telegramMessage.text) {
          // Text message
          success = await whatsappManager.sendTextMessage(group.id, telegramMessage.text)
        } else if (telegramMessage.photo) {
          // Photo message (simulated)
          const caption = telegramMessage.caption || ""
          success = await whatsappManager.sendImageMessage(group.id, Buffer.from(""), caption)
        } else if (telegramMessage.video) {
          // Video message (simulated)
          const caption = telegramMessage.caption || ""
          success = await whatsappManager.sendVideoMessage(group.id, Buffer.from(""), caption)
        }

        results.push({
          groupId: group.id,
          groupName: group.name,
          success,
        })

        // Wait between groups
        await this.sleep(this.config.whatsapp.delays.betweenGroups * 1000)
      } catch (error) {
        console.error(`❌ خطأ في إرسال الرسالة إلى ${group.name}:`, error)
        results.push({
          groupId: group.id,
          groupName: group.name,
          success: false,
          error: error instanceof Error ? error.message : "خطأ غير معروف",
        })
      }
    }

    // Save message to database
    await saveMessage({
      telegram_message_id: telegramMessage.message_id || Date.now(),
      content: telegramMessage.text || telegramMessage.caption || "",
      media_type: telegramMessage.photo ? "photo" : telegramMessage.video ? "video" : "text",
      forwarded_to_groups: results.map((r) => r.groupId),
      success_count: results.filter((r) => r.success).length,
      failed_count: results.filter((r) => !r.success).length,
      status: "completed",
    })

    // Update hourly count
    this.hourlyMessageCount++
    this.resetHourlyCountIfNeeded()
  }

  private checkRateLimit(): boolean {
    this.resetHourlyCountIfNeeded()
    return this.hourlyMessageCount < this.config.security.maxMessagesPerHour
  }

  private resetHourlyCountIfNeeded(): void {
    const now = new Date()
    const hoursSinceReset = (now.getTime() - this.lastHourReset.getTime()) / (1000 * 60 * 60)

    if (hoursSinceReset >= 1) {
      this.hourlyMessageCount = 0
      this.lastHourReset = now
    }
  }

  private isMessageBlocked(text: string): boolean {
    if (!this.config.security.blockedWords.length) return false

    const lowerText = text.toLowerCase()
    return this.config.security.blockedWords.some((word) => lowerText.includes(word.toLowerCase()))
  }

  private calculateDelay(groupCount: number): number {
    const baseDelay =
      Math.random() * (this.config.whatsapp.delays.max - this.config.whatsapp.delays.min) +
      this.config.whatsapp.delays.min

    // Add extra delay for larger group counts
    const groupMultiplier = Math.min(groupCount / 10, 2) // Max 2x multiplier

    return Math.floor(baseDelay * (1 + groupMultiplier)) * 1000 // Convert to milliseconds
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  async stop(): Promise<void> {
    try {
      console.log("🛑 إيقاف البوت...")

      this.stats.isRunning = false
      this.messageQueue = []
      this.isProcessing = false

      await whatsappManager.disconnect()

      console.log("✅ تم إيقاف البوت")
      await addLog("info", "تم إيقاف البوت")
    } catch (error) {
      console.error("❌ خطأ في إيقاف البوت:", error)
      await addLog("error", "خطأ في إيقاف البوت", { error: error instanceof Error ? error.message : "خطأ غير معروف" })
    }
  }

  getStats(): BotStats {
    if (this.startTime) {
      this.stats.uptime = Math.floor((Date.now() - this.startTime.getTime()) / 1000)
    }

    this.stats.messagesThisHour = this.hourlyMessageCount

    return { ...this.stats }
  }

  async getGroups(): Promise<any[]> {
    try {
      if (whatsappManager.isConnected()) {
        const groups = await whatsappManager.getGroups()
        await saveGroups(groups)
        return groups
      }
      return []
    } catch (error) {
      console.error("❌ خطأ في جلب المجموعات:", error)
      return []
    }
  }

  isRunning(): boolean {
    return this.stats.isRunning
  }
}
