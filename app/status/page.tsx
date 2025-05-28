"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Activity, Database, MessageSquare, Smartphone, Server, RefreshCw, Clock } from "lucide-react"

interface HealthStatus {
  status: string
  timestamp: string
  services: {
    whatsapp: { connected: boolean; status: string }
    database: { status: string }
    telegram: { status: string }
  }
  uptime: number
  memory: { used: number; total: number }
  environment: string
}

export default function StatusPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const fetchHealth = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/health")
      const data = await response.json()
      setHealth(data)
      setLastUpdate(new Date())
    } catch (error) {
      console.error("خطأ في جلب حالة النظام:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealth()
    const interval = setInterval(fetchHealth, 30000) // كل 30 ثانية
    return () => clearInterval(interval)
  }, [])

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (days > 0) return `${days} يوم، ${hours} ساعة`
    if (hours > 0) return `${hours} ساعة، ${minutes} دقيقة`
    return `${minutes} دقيقة`
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "healthy":
      case "connected":
        return "default"
      case "unhealthy":
      case "disconnected":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getStatusIcon = (service: string, status: string) => {
    const iconClass = "h-5 w-5"
    const isHealthy = status === "connected" || status === "healthy"

    switch (service) {
      case "whatsapp":
        return <Smartphone className={`${iconClass} ${isHealthy ? "text-green-500" : "text-red-500"}`} />
      case "database":
        return <Database className={`${iconClass} ${isHealthy ? "text-green-500" : "text-red-500"}`} />
      case "telegram":
        return <MessageSquare className={`${iconClass} ${isHealthy ? "text-green-500" : "text-red-500"}`} />
      default:
        return <Activity className={`${iconClass} ${isHealthy ? "text-green-500" : "text-red-500"}`} />
    }
  }

  if (loading && !health) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>جاري تحميل حالة النظام...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">📊 حالة النظام</h1>
          <p className="text-gray-600">مراقبة صحة وأداء البوت</p>
        </div>

        {/* الحالة العامة */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                الحالة العامة
              </div>
              <Button variant="outline" size="sm" onClick={fetchHealth} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ml-2 ${loading ? "animate-spin" : ""}`} />
                تحديث
              </Button>
            </CardTitle>
            <CardDescription>آخر تحديث: {lastUpdate.toLocaleString("ar-SA")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <Badge variant={getStatusColor(health?.status || "unknown")} className="text-lg px-4 py-2">
                {health?.status === "healthy" ? "النظام يعمل بشكل طبيعي" : "يوجد مشاكل في النظام"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* حالة الخدمات */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                {getStatusIcon("whatsapp", health?.services.whatsapp.status || "unknown")}
                واتساب
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={getStatusColor(health?.services.whatsapp.status || "unknown")}>
                {health?.services.whatsapp.connected ? "متصل" : "غير متصل"}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                {getStatusIcon("telegram", health?.services.telegram.status || "unknown")}
                تلقرام
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={getStatusColor(health?.services.telegram.status || "unknown")}>
                {health?.services.telegram.status === "connected" ? "متصل" : "غير متصل"}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                {getStatusIcon("database", health?.services.database.status || "unknown")}
                قاعدة البيانات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={getStatusColor(health?.services.database.status || "unknown")}>
                {health?.services.database.status === "connected" ? "متصل" : "غير متصل"}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* معلومات النظام */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                وقت التشغيل
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{health ? formatUptime(health.uptime) : "غير متاح"}</div>
              <p className="text-sm text-gray-500">منذ آخر إعادة تشغيل</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                استخدام الذاكرة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>المستخدم: {health?.memory.used || 0} MB</span>
                <span>الإجمالي: {health?.memory.total || 0} MB</span>
              </div>
              <Progress value={health ? (health.memory.used / health.memory.total) * 100 : 0} className="h-2" />
            </CardContent>
          </Card>
        </div>

        {/* معلومات البيئة */}
        <Card>
          <CardHeader>
            <CardTitle>معلومات البيئة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">البيئة</p>
                <p className="font-medium">{health?.environment || "غير محدد"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">آخر فحص</p>
                <p className="font-medium">
                  {health ? new Date(health.timestamp).toLocaleTimeString("ar-SA") : "غير متاح"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">الإصدار</p>
                <p className="font-medium">1.0.0</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">المنطقة الزمنية</p>
                <p className="font-medium">{Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* تحذيرات */}
        {health?.status !== "healthy" && (
          <Alert>
            <AlertDescription>
              <strong>تحذير:</strong> يوجد مشاكل في النظام. يرجى مراجعة حالة الخدمات أعلاه واتخاذ الإجراءات اللازمة.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}
