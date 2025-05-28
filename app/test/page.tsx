"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Send,
  ImageIcon,
  Video,
  FileText,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Eye,
  Download,
} from "lucide-react"

interface Group {
  id: string
  name: string
  participants: number
  enabled: boolean
  isAdmin: boolean
}

interface TestMessage {
  id: string
  type: "text" | "image" | "video" | "document"
  content: string
  groups: string[]
  timestamp: Date
  status: "pending" | "sending" | "success" | "failed"
  results: { groupId: string; groupName: string; success: boolean; error?: string }[]
}

export default function TestMessagesPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [messageText, setMessageText] = useState("")
  const [messageType, setMessageType] = useState<"text" | "image" | "video">("text")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [testMessages, setTestMessages] = useState<TestMessage[]>([])
  const [sendProgress, setSendProgress] = useState(0)
  const [previewMode, setPreviewMode] = useState(false)

  // تحميل المجموعات
  useEffect(() => {
    loadGroups()
  }, [])

  const loadGroups = async () => {
    try {
      const response = await fetch("/api/whatsapp?action=groups")
      if (response.ok) {
        const data = await response.json()
        setGroups(data)
      }
    } catch (error) {
      console.error("خطأ في تحميل المجموعات:", error)
    }
  }

  // تحديد/إلغاء تحديد مجموعة
  const toggleGroup = (groupId: string) => {
    setSelectedGroups((prev) => (prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]))
  }

  // تحديد جميع المجموعات
  const selectAllGroups = () => {
    setSelectedGroups(groups.map((g) => g.id))
  }

  // إلغاء تحديد جميع المجموعات
  const clearAllGroups = () => {
    setSelectedGroups([])
  }

  // معالجة اختيار الملف
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  // إرسال رسالة تجريبية
  const sendTestMessage = async () => {
    if (!messageText.trim() && !selectedFile) {
      alert("يرجى إدخال نص أو اختيار ملف")
      return
    }

    if (selectedGroups.length === 0) {
      alert("يرجى اختيار مجموعة واحدة على الأقل")
      return
    }

    setIsSending(true)
    setSendProgress(0)

    const testMessage: TestMessage = {
      id: Date.now().toString(),
      type: messageType,
      content: messageText,
      groups: selectedGroups,
      timestamp: new Date(),
      status: "sending",
      results: [],
    }

    setTestMessages((prev) => [testMessage, ...prev])

    try {
      const selectedGroupsData = groups.filter((g) => selectedGroups.includes(g.id))
      const results: TestMessage["results"] = []

      for (let i = 0; i < selectedGroupsData.length; i++) {
        const group = selectedGroupsData[i]

        try {
          // محاكاة تأخير الإرسال
          await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))

          // إرسال الرسالة
          const response = await fetch("/api/whatsapp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "send-message",
              data: {
                groupId: group.id,
                message: messageText,
                type: messageType,
                file: selectedFile ? await fileToBase64(selectedFile) : null,
              },
            }),
          })

          const result = await response.json()

          results.push({
            groupId: group.id,
            groupName: group.name,
            success: result.success,
            error: result.success ? undefined : result.error || "خطأ غير معروف",
          })

          // تحديث التقدم
          setSendProgress(((i + 1) / selectedGroupsData.length) * 100)
        } catch (error) {
          results.push({
            groupId: group.id,
            groupName: group.name,
            success: false,
            error: error instanceof Error ? error.message : "خطأ في الإرسال",
          })
        }
      }

      // تحديث حالة الرسالة
      setTestMessages((prev) =>
        prev.map((msg) =>
          msg.id === testMessage.id
            ? {
                ...msg,
                status: results.every((r) => r.success) ? "success" : "failed",
                results,
              }
            : msg,
        ),
      )
    } catch (error) {
      console.error("خطأ في إرسال الرسالة:", error)
      setTestMessages((prev) => prev.map((msg) => (msg.id === testMessage.id ? { ...msg, status: "failed" } : msg)))
    } finally {
      setIsSending(false)
      setSendProgress(0)
    }
  }

  // تحويل الملف إلى base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
  }

  // حساب إحصائيات الإرسال
  const getStats = () => {
    const total = testMessages.length
    const successful = testMessages.filter((msg) => msg.status === "success").length
    const failed = testMessages.filter((msg) => msg.status === "failed").length
    const pending = testMessages.filter((msg) => msg.status === "sending").length

    return { total, successful, failed, pending }
  }

  const stats = getStats()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">🧪 اختبار إرسال الرسائل</h1>
          <p className="text-gray-600">اختبر البوت قبل تشغيله تلقائياً</p>
        </div>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">إجمالي الاختبارات</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.successful}</div>
              <div className="text-sm text-gray-600">نجح</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
              <div className="text-sm text-gray-600">فشل</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">قيد الإرسال</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* نموذج إرسال الرسالة */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  إرسال رسالة تجريبية
                </CardTitle>
                <CardDescription>اختبر إرسال الرسائل إلى المجموعات المحددة</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs value={messageType} onValueChange={(value) => setMessageType(value as any)}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="text" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      نص
                    </TabsTrigger>
                    <TabsTrigger value="image" className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      صورة
                    </TabsTrigger>
                    <TabsTrigger value="video" className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      فيديو
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="text" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="message">نص الرسالة</Label>
                      <Textarea
                        id="message"
                        placeholder="اكتب رسالتك هنا..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        rows={4}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="image" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="image">اختر صورة</Label>
                      <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="cursor-pointer"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="caption">وصف الصورة (اختياري)</Label>
                      <Textarea
                        id="caption"
                        placeholder="وصف للصورة..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        rows={2}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="video" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="video">اختر فيديو</Label>
                      <Input
                        id="video"
                        type="file"
                        accept="video/*"
                        onChange={handleFileSelect}
                        className="cursor-pointer"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="videoCaption">وصف الفيديو (اختياري)</Label>
                      <Textarea
                        id="videoCaption"
                        placeholder="وصف للفيديو..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        rows={2}
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                {/* معاينة الملف المحدد */}
                {selectedFile && (
                  <Alert>
                    <Eye className="h-4 w-4" />
                    <AlertDescription>
                      <strong>الملف المحدد:</strong> {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)}{" "}
                      MB)
                    </AlertDescription>
                  </Alert>
                )}

                {/* أزرار التحكم */}
                <div className="flex gap-2">
                  <Button
                    onClick={sendTestMessage}
                    disabled={isSending || selectedGroups.length === 0}
                    className="flex-1"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin ml-2" />
                        جاري الإرسال...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 ml-2" />
                        إرسال تجريبي
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}>
                    <Eye className="h-4 w-4 ml-2" />
                    معاينة
                  </Button>
                </div>

                {/* شريط التقدم */}
                {isSending && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>جاري الإرسال...</span>
                      <span>{Math.round(sendProgress)}%</span>
                    </div>
                    <Progress value={sendProgress} />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* معاينة الرسالة */}
            {previewMode && (messageText || selectedFile) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    معاينة الرسالة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-green-50 p-4 rounded-lg border-r-4 border-green-500">
                    {selectedFile && (
                      <div className="mb-2">
                        <Badge variant="outline">{messageType === "image" ? "📷 صورة" : "🎥 فيديو"}</Badge>
                        <p className="text-sm text-gray-600 mt-1">{selectedFile.name}</p>
                      </div>
                    )}
                    {messageText && (
                      <div className="whitespace-pre-wrap">
                        {messageText}
                        <div className="text-xs text-gray-500 mt-2">
                          📅 {new Date().toLocaleString("ar-SA")}
                          <br />🔗 من قناة تلقرام
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* اختيار المجموعات */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  اختيار المجموعات ({selectedGroups.length})
                </CardTitle>
                <CardDescription>اختر المجموعات لإرسال الرسالة إليها</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllGroups} className="flex-1">
                    تحديد الكل
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearAllGroups} className="flex-1">
                    إلغاء الكل
                  </Button>
                </div>

                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {groups.map((group) => (
                      <div
                        key={group.id}
                        className="flex items-center space-x-2 space-x-reverse p-2 border rounded hover:bg-gray-50 cursor-pointer"
                        onClick={() => toggleGroup(group.id)}
                      >
                        <Checkbox checked={selectedGroups.includes(group.id)} onChange={() => toggleGroup(group.id)} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{group.name}</p>
                          <p className="text-sm text-gray-500">
                            {group.participants} عضو {group.isAdmin && "• مشرف"}
                          </p>
                        </div>
                        {group.isAdmin && <Badge variant="default">مشرف</Badge>}
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {groups.length === 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>لا توجد مجموعات متاحة. تأكد من اتصال واتساب.</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* سجل الرسائل المرسلة */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                سجل الرسائل التجريبية
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 ml-2" />
                تصدير السجل
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {testMessages.map((message) => (
                  <div key={message.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            message.status === "success"
                              ? "default"
                              : message.status === "failed"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {message.status === "success" && <CheckCircle className="h-3 w-3 ml-1" />}
                          {message.status === "failed" && <XCircle className="h-3 w-3 ml-1" />}
                          {message.status === "sending" && <Loader2 className="h-3 w-3 animate-spin ml-1" />}
                          {message.status === "success" ? "نجح" : message.status === "failed" ? "فشل" : "جاري الإرسال"}
                        </Badge>
                        <Badge variant="outline">{message.type}</Badge>
                      </div>
                      <span className="text-sm text-gray-500">{message.timestamp.toLocaleString("ar-SA")}</span>
                    </div>

                    <div className="text-sm">
                      <strong>المحتوى:</strong> {message.content.substring(0, 100)}
                      {message.content.length > 100 && "..."}
                    </div>

                    <div className="text-sm">
                      <strong>المجموعات:</strong> {message.groups.length} مجموعة
                    </div>

                    {/* نتائج الإرسال */}
                    {message.results.length > 0 && (
                      <div className="space-y-1">
                        <strong className="text-sm">النتائج:</strong>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {message.results.map((result) => (
                            <div
                              key={result.groupId}
                              className={`text-xs p-2 rounded ${
                                result.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                              }`}
                            >
                              <div className="flex items-center gap-1">
                                {result.success ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                <span className="font-medium">{result.groupName}</span>
                              </div>
                              {result.error && <div className="mt-1">{result.error}</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {testMessages.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>لم يتم إرسال أي رسائل تجريبية بعد</p>
                    <p className="text-sm">ابدأ بإرسال رسالة تجريبية لرؤية النتائج هنا</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
