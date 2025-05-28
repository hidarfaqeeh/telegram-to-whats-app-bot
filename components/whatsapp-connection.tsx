"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Smartphone, Wifi, WifiOff, QrCode, CheckCircle, AlertCircle } from "lucide-react"

interface WhatsAppStatus {
  connected: boolean
  account?: {
    name: string
    number: string
    platform: string
  }
}

export function WhatsAppConnection() {
  const [status, setStatus] = useState<WhatsAppStatus>({ connected: false })
  const [qrCode, setQrCode] = useState<string>("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [groups, setGroups] = useState<any[]>([])

  // تحديث حالة الاتصال
  const checkStatus = async () => {
    try {
      const response = await fetch("/api/whatsapp?action=status")
      const data = await response.json()
      setStatus(data)

      if (data.connected) {
        loadGroups()
      }
    } catch (error) {
      console.error("خطأ في فحص حالة واتساب:", error)
    }
  }

  // تحميل المجموعات
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

  // بدء الاتصال
  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      const response = await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "connect" }),
      })

      const data = await response.json()
      if (data.success) {
        // محاولة الحصول على QR Code
        setTimeout(checkStatus, 2000)
      }
    } catch (error) {
      console.error("خطأ في الاتصال:", error)
    } finally {
      setIsConnecting(false)
    }
  }

  // قطع الاتصال
  const handleDisconnect = async () => {
    try {
      await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect" }),
      })

      setStatus({ connected: false })
      setGroups([])
      setQrCode("")
    } catch (error) {
      console.error("خطأ في قطع الاتصال:", error)
    }
  }

  // فحص دوري للحالة
  useEffect(() => {
    checkStatus()
    const interval = setInterval(checkStatus, 10000) // كل 10 ثوان
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6" dir="rtl">
      {/* حالة الاتصال */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            حالة اتصال واتساب
          </CardTitle>
          <CardDescription>إدارة اتصال البوت بواتساب</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {status.connected ? (
                <>
                  <Wifi className="h-5 w-5 text-green-500" />
                  <Badge variant="default">متصل</Badge>
                </>
              ) : (
                <>
                  <WifiOff className="h-5 w-5 text-red-500" />
                  <Badge variant="secondary">غير متصل</Badge>
                </>
              )}
            </div>

            <div className="flex gap-2">
              {status.connected ? (
                <Button onClick={handleDisconnect} variant="destructive" size="sm">
                  قطع الاتصال
                </Button>
              ) : (
                <Button onClick={handleConnect} disabled={isConnecting} size="sm">
                  {isConnecting ? "جاري الاتصال..." : "اتصال"}
                </Button>
              )}
            </div>
          </div>

          {/* معلومات الحساب */}
          {status.connected && status.account && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>متصل كـ:</strong> {status.account.name} ({status.account.number})
                <br />
                <strong>المنصة:</strong> {status.account.platform}
              </AlertDescription>
            </Alert>
          )}

          {/* QR Code للمسح */}
          {!status.connected && qrCode && (
            <Alert>
              <QrCode className="h-4 w-4" />
              <AlertDescription>
                <strong>امسح رمز QR بواتساب:</strong>
                <div className="mt-2 flex justify-center">
                  <img src={qrCode || "/placeholder.svg"} alt="QR Code" className="border rounded" />
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* تعليمات الاتصال */}
          {!status.connected && !qrCode && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>خطوات الاتصال:</strong>
                <ol className="mt-2 list-decimal list-inside space-y-1 text-sm">
                  <li>اضغط على زر "اتصال"</li>
                  <li>انتظر ظهور رمز QR</li>
                  <li>افتح واتساب على هاتفك</li>
                  <li>اذهب إلى الإعدادات {">"} الأجهزة المرتبطة</li>
                  <li>امسح رمز QR</li>
                </ol>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* المجموعات المتاحة */}
      {status.connected && groups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>المجموعات المتاحة ({groups.length})</CardTitle>
            <CardDescription>المجموعات التي يمكن للبوت الإرسال إليها</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {groups.map((group) => (
                <div key={group.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <h4 className="font-medium">{group.name}</h4>
                    <p className="text-sm text-gray-500">
                      {group.participants} عضو
                      {group.isAdmin && " • أنت مشرف"}
                    </p>
                  </div>
                  <Badge variant={group.isAdmin ? "default" : "secondary"}>{group.isAdmin ? "مشرف" : "عضو"}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
