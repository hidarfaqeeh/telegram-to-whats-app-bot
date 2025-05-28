"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  Activity,
  MessageSquare,
  Users,
  Clock,
  Play,
  Settings,
  Database,
  Smartphone,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
} from "lucide-react"

interface SystemStatus {
  database: boolean
  telegram: boolean
  whatsapp: boolean
  overall: boolean
}

export default function HomePage() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    database: false,
    telegram: false,
    whatsapp: false,
    overall: false,
  })

  const [setupProgress, setSetupProgress] = useState(0)
  const [isFirstTime, setIsFirstTime] = useState(true)

  useEffect(() => {
    checkSystemStatus()
  }, [])

  const checkSystemStatus = async () => {
    try {
      // فحص قاعدة البيانات
      const dbResponse = await fetch("/api/database/status")
      const dbData = await dbResponse.json()

      // فحص متغيرات البيئة
      const envResponse = await fetch("/api/setup/check-env")
      const envData = await envResponse.json()

      const status = {
        database: dbData.connected,
        telegram: !!process.env.TELEGRAM_BOT_TOKEN || envData.present_vars.includes("TELEGRAM_BOT_TOKEN"),
        whatsapp: false, // سيتم تحديثه لاحقاً
        overall: false,
      }

      status.overall = status.database && status.telegram

      setSystemStatus(status)

      // حساب تقدم الإعداد
      const completedSteps = Object.values(status).filter(Boolean).length - 1 // استثناء overall
      const progress = (completedSteps / 3) * 100
      setSetupProgress(progress)

      // تحديد إذا كانت هذه المرة الأولى
      setIsFirstTime(progress < 50)
    } catch (error) {
      console.error("خطأ في فحص حالة النظام:", error)
    }
  }

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <AlertTriangle className="h-5 w-5 text-red-500" />
    )
  }

  const getStatusBadge = (status: boolean) => {
    return <Badge variant={status ? "default" : "destructive"}>{status ? "جاهز" : "يحتاج إعداد"}</Badge>
  }

  if (isFirstTime) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4" dir="rtl">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Welcome Header */}
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-bold text-gray-900">🤖 مرحباً بك!</h1>
            <p className="text-xl text-gray-600">بوت إعادة توجيه الرسائل من تلقرام إلى واتساب</p>
            <div className="flex justify-center">
              <Badge variant="outline" className="text-lg px-4 py-2">
                الإصدار 1.0.0
              </Badge>
            </div>
          </div>

          {/* Setup Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>تقدم الإعداد</span>
                <Badge variant={setupProgress === 100 ? "default" : "secondary"}>
                  {Math.round(setupProgress)}% مكتمل
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={setupProgress} className="h-3" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    <span>قاعدة البيانات</span>
                  </div>
                  {getStatusBadge(systemStatus.database)}
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    <span>تلقرام</span>
                  </div>
                  {getStatusBadge(systemStatus.telegram)}
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    <span>واتساب</span>
                  </div>
                  {getStatusBadge(systemStatus.whatsapp)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Start Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  البدء السريع
                </CardTitle>
                <CardDescription>اجعل البوت يعمل في 15 دقيقة</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>إعداد قاعدة البيانات (5 دقائق)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>إنشاء بوت تلقرام (3 دقائق)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>نشر التطبيق (2 دقيقة)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>ربط واتساب (5 دقائق)</span>
                  </div>
                </div>

                <Button className="w-full" asChild>
                  <a href="/quick-start">
                    <Play className="h-4 w-4 ml-2" />
                    البدء السريع
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  الإعداد المفصل
                </CardTitle>
                <CardDescription>دليل شامل خطوة بخطوة</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                    <span>شرح مفصل لكل خطوة</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                    <span>نصائح وإرشادات متقدمة</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                    <span>استكشاف الأخطاء وحلها</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                    <span>إعدادات متقدمة</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full" asChild>
                  <a href="/setup-guide">
                    <Settings className="h-4 w-4 ml-2" />
                    الدليل المفصل
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Features Overview */}
          <Card>
            <CardHeader>
              <CardTitle>مميزات البوت</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <h4 className="font-medium">إعادة توجيه تلقائية</h4>
                  <p className="text-sm text-gray-600">إعادة توجيه الرسائل من قناة تلقرام إلى مجموعات واتساب</p>
                </div>

                <div className="text-center p-4">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <h4 className="font-medium">تأخير ذكي</h4>
                  <p className="text-sm text-gray-600">تأخير متغير لتجنب الحظر والكشف</p>
                </div>

                <div className="text-center p-4">
                  <Activity className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                  <h4 className="font-medium">مراقبة شاملة</h4>
                  <p className="text-sm text-gray-600">إحصائيات مفصلة ومراقبة الأداء</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Important Notes */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>مهم:</strong> تأكد من استخدام رقم واتساب منفصل للبوت، ولا تستخدم رقمك الشخصي لتجنب أي مشاكل. يُفضل
              استخدام واتساب بيزنس.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  // Main Dashboard (when setup is complete)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">🤖 لوحة تحكم البوت</h1>
          <p className="text-gray-600">إدارة ومراقبة بوت إعادة توجيه الرسائل</p>
        </div>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              حالة النظام
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  {getStatusIcon(systemStatus.overall)}
                  <span>النظام العام</span>
                </div>
                {getStatusBadge(systemStatus.overall)}
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  {getStatusIcon(systemStatus.database)}
                  <span>قاعدة البيانات</span>
                </div>
                {getStatusBadge(systemStatus.database)}
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  {getStatusIcon(systemStatus.telegram)}
                  <span>تلقرام</span>
                </div>
                {getStatusBadge(systemStatus.telegram)}
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  {getStatusIcon(systemStatus.whatsapp)}
                  <span>واتساب</span>
                </div>
                {getStatusBadge(systemStatus.whatsapp)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">🔧 الإعداد</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a href="/setup">
                    <Smartphone className="h-4 w-4 ml-2" />
                    ربط واتساب
                  </a>
                </Button>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a href="/database">
                    <Database className="h-4 w-4 ml-2" />
                    قاعدة البيانات
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">🧪 الاختبار</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a href="/test">
                    <MessageSquare className="h-4 w-4 ml-2" />
                    اختبار الرسائل
                  </a>
                </Button>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a href="/status">
                    <Activity className="h-4 w-4 ml-2" />
                    حالة النظام
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">⚡ التلقائي</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a href="/auto-setup">
                    <Settings className="h-4 w-4 ml-2" />
                    الإعداد التلقائي
                  </a>
                </Button>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a href="/quick-start">
                    <Play className="h-4 w-4 ml-2" />
                    البدء السريع
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">📚 المساعدة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a href="/setup-guide">
                    <ExternalLink className="h-4 w-4 ml-2" />
                    دليل الإعداد
                  </a>
                </Button>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a href="/api/health" target="_blank" rel="noreferrer">
                    <Activity className="h-4 w-4 ml-2" />
                    فحص الصحة
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bot Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الرسائل المرسلة</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">+0 اليوم</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المجموعات النشطة</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">من أصل 0 مجموعة</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">معدل النجاح</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">100%</div>
              <p className="text-xs text-muted-foreground">آخر 24 ساعة</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">وقت التشغيل</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0د</div>
              <p className="text-xs text-muted-foreground">منذ آخر إعادة تشغيل</p>
            </CardContent>
          </Card>
        </div>

        {/* Getting Started */}
        {!systemStatus.overall && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>البوت غير جاهز:</strong> يحتاج البوت إلى إعداد إضافي. يرجى اتباع{" "}
              <a href="/setup-guide" className="text-blue-600 underline">
                دليل الإعداد
              </a>{" "}
              لإكمال التكوين.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}
