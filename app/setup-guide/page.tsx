"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Database,
  MessageSquare,
  Smartphone,
  Settings,
  Play,
  Copy,
  ExternalLink,
} from "lucide-react"

interface SetupStep {
  id: string
  title: string
  description: string
  status: "pending" | "completed" | "error"
  required: boolean
}

export default function SetupGuidePage() {
  const [setupSteps, setSetupSteps] = useState<SetupStep[]>([
    {
      id: "env-vars",
      title: "متغيرات البيئة",
      description: "التحقق من وجود جميع متغيرات البيئة المطلوبة",
      status: "pending",
      required: true,
    },
    {
      id: "database",
      title: "قاعدة البيانات",
      description: "إعداد واختبار الاتصال بقاعدة البيانات",
      status: "pending",
      required: true,
    },
    {
      id: "telegram",
      title: "بوت تلقرام",
      description: "إعداد بوت تلقرام والحصول على التوكن",
      status: "pending",
      required: true,
    },
    {
      id: "whatsapp",
      title: "واتساب",
      description: "ربط واتساب وإعداد الجلسة",
      status: "pending",
      required: true,
    },
    {
      id: "auto-setup",
      title: "التنصيب التلقائي",
      description: "تشغيل الإعداد التلقائي لقاعدة البيانات",
      status: "pending",
      required: false,
    },
  ])

  const [currentStep, setCurrentStep] = useState(0)
  const [setupProgress, setSetupProgress] = useState(0)

  useEffect(() => {
    checkSetupStatus()
  }, [])

  const checkSetupStatus = async () => {
    // فحص متغيرات البيئة
    try {
      const envResponse = await fetch("/api/setup/check-env")
      const envData = await envResponse.json()
      updateStepStatus("env-vars", envData.success ? "completed" : "error")
    } catch {
      updateStepStatus("env-vars", "error")
    }

    // فحص قاعدة البيانات
    try {
      const dbResponse = await fetch("/api/database/status")
      const dbData = await dbResponse.json()
      updateStepStatus("database", dbData.connected ? "completed" : "error")
    } catch {
      updateStepStatus("database", "error")
    }

    // حساب التقدم
    calculateProgress()
  }

  const updateStepStatus = (stepId: string, status: "pending" | "completed" | "error") => {
    setSetupSteps((prev) => prev.map((step) => (step.id === stepId ? { ...step, status } : step)))
  }

  const calculateProgress = () => {
    const completedSteps = setupSteps.filter((step) => step.status === "completed").length
    const progress = (completedSteps / setupSteps.length) * 100
    setSetupProgress(progress)
  }

  const runAutoSetup = async () => {
    try {
      const response = await fetch("/api/setup/auto-install", { method: "POST" })
      const result = await response.json()

      if (result.success) {
        updateStepStatus("auto-setup", "completed")
        updateStepStatus("database", "completed")
        alert("✅ تم التنصيب التلقائي بنجاح!")
        checkSetupStatus()
      } else {
        updateStepStatus("auto-setup", "error")
        alert(`❌ فشل التنصيب: ${result.message}`)
      }
    } catch (error) {
      updateStepStatus("auto-setup", "error")
      alert("❌ خطأ في التنصيب التلقائي")
    }
  }

  const getStepIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert("✅ تم نسخ النص")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">🚀 دليل إعداد البوت</h1>
          <p className="text-gray-600">اتبع هذه الخطوات لإعداد بوت تلقرام - واتساب</p>
        </div>

        {/* Progress Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>تقدم الإعداد</span>
              <Badge variant={setupProgress === 100 ? "default" : "secondary"}>
                {Math.round(setupProgress)}% مكتمل
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={setupProgress} className="h-3 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              {setupSteps.map((step, index) => (
                <div
                  key={step.id}
                  className={`p-3 rounded-lg border text-center cursor-pointer transition-colors ${
                    step.status === "completed"
                      ? "bg-green-50 border-green-200"
                      : step.status === "error"
                        ? "bg-red-50 border-red-200"
                        : "bg-yellow-50 border-yellow-200"
                  }`}
                  onClick={() => setCurrentStep(index)}
                >
                  <div className="flex justify-center mb-1">{getStepIcon(step.status)}</div>
                  <div className="text-sm font-medium">{step.title}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Setup Steps */}
        <Tabs value={setupSteps[currentStep]?.id} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            {setupSteps.map((step, index) => (
              <TabsTrigger
                key={step.id}
                value={step.id}
                onClick={() => setCurrentStep(index)}
                className="flex items-center gap-2"
              >
                {getStepIcon(step.status)}
                <span className="hidden md:inline">{step.title}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Step 1: Environment Variables */}
          <TabsContent value="env-vars">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  متغيرات البيئة
                </CardTitle>
                <CardDescription>التحقق من إعداد جميع متغيرات البيئة المطلوبة</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>✅ تم إضافة جميع متغيرات البيئة إلى مشروع Vercel بنجاح!</AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">🔐 متغيرات الأمان</h4>
                    <ul className="text-sm space-y-1">
                      <li>• ENCRYPTION_KEY - مفتاح التشفير (32 حرف)</li>
                      <li>• ADMIN_CHAT_ID - معرف المشرف</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">🗄️ قاعدة البيانات</h4>
                    <ul className="text-sm space-y-1">
                      <li>• DATABASE_TYPE - نوع قاعدة البيانات</li>
                      <li>• DATABASE_HOST - عنوان الخادم</li>
                      <li>• DATABASE_PORT - رقم المنفذ</li>
                      <li>• DATABASE_USERNAME - اسم المستخدم</li>
                      <li>• DATABASE_PASSWORD - كلمة المرور</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">🤖 تلقرام</h4>
                    <ul className="text-sm space-y-1">
                      <li>• TELEGRAM_BOT_TOKEN - توكن البوت</li>
                      <li>• TELEGRAM_CHANNEL_ID - معرف القناة</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">📱 واتساب</h4>
                    <ul className="text-sm space-y-1">
                      <li>• WHATSAPP_SESSION_DATA - بيانات الجلسة</li>
                      <li>• WHATSAPP_SESSION_NAME - اسم الجلسة</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Step 2: Database */}
          <TabsContent value="database">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  إعداد قاعدة البيانات
                </CardTitle>
                <CardDescription>إنشاء واختبار قاعدة البيانات</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">🏆 التوصيات</h4>
                    <ul className="text-sm space-y-1">
                      <li>
                        • <strong>Supabase:</strong> PostgreSQL مجاني حتى 500MB
                      </li>
                      <li>
                        • <strong>Northflank:</strong> PostgreSQL $15/شهر
                      </li>
                      <li>
                        • <strong>PlanetScale:</strong> MySQL مجاني حتى 1GB
                      </li>
                      <li>
                        • <strong>MongoDB Atlas:</strong> مجاني حتى 512MB
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">⚙️ الإعداد</h4>
                    <div className="space-y-2">
                      <Button onClick={runAutoSetup} className="w-full">
                        <Database className="h-4 w-4 ml-2" />
                        تشغيل الإعداد التلقائي
                      </Button>
                      <Button variant="outline" className="w-full" asChild>
                        <a href="/database" target="_blank" rel="noreferrer">
                          <ExternalLink className="h-4 w-4 ml-2" />
                          اختبار قاعدة البيانات
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>مهم:</strong> تأكد من إعداد قاعدة البيانات أولاً قبل المتابعة. يمكنك استخدام Supabase مجاناً
                    أو أي خدمة أخرى.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Step 3: Telegram */}
          <TabsContent value="telegram">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  إعداد بوت تلقرام
                </CardTitle>
                <CardDescription>إنشاء بوت تلقرام والحصول على التوكن</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">📝 خطوات إنشاء البوت</h4>
                    <ol className="text-sm space-y-1 list-decimal list-inside">
                      <li>ابحث عن @BotFather في تلقرام</li>
                      <li>أرسل الأمر /newbot</li>
                      <li>اختر اسماً للبوت</li>
                      <li>اختر معرفاً للبوت (ينتهي بـ bot)</li>
                      <li>احفظ التوكن الذي ستحصل عليه</li>
                    </ol>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">📢 إعداد القناة</h4>
                    <ol className="text-sm space-y-1 list-decimal list-inside">
                      <li>أنشئ قناة تلقرام جديدة</li>
                      <li>أضف البوت كمشرف في القناة</li>
                      <li>امنح البوت صلاحية إرسال الرسائل</li>
                      <li>احفظ معرف القناة (مثل @mychannel)</li>
                    </ol>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">🔧 مثال على الإعدادات</h4>
                  <div className="font-mono text-sm space-y-1">
                    <div>TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz</div>
                    <div>TELEGRAM_CHANNEL_ID=@mychannel</div>
                    <div>ADMIN_CHAT_ID=123456789</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() =>
                      copyToClipboard(`TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHANNEL_ID=@mychannel
ADMIN_CHAT_ID=123456789`)
                    }
                  >
                    <Copy className="h-4 w-4 ml-2" />
                    نسخ المثال
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Step 4: WhatsApp */}
          <TabsContent value="whatsapp">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  إعداد واتساب
                </CardTitle>
                <CardDescription>ربط واتساب وإعداد الجلسة</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">📱 متطلبات واتساب</h4>
                    <ul className="text-sm space-y-1">
                      <li>• رقم واتساب منفصل للبوت</li>
                      <li>• يُفضل واتساب بيزنس</li>
                      <li>• اتصال إنترنت مستقر</li>
                      <li>• عدم فتح واتساب ويب في مكان آخر</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">🔗 خطوات الربط</h4>
                    <ol className="text-sm space-y-1 list-decimal list-inside">
                      <li>اذهب إلى صفحة /setup</li>
                      <li>اضغط على "اتصال"</li>
                      <li>امسح QR Code بواتساب</li>
                      <li>انتظر حتى يتم الاتصال</li>
                      <li>صدّر الجلسة للاستخدام التلقائي</li>
                    </ol>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button className="w-full" asChild>
                    <a href="/setup" target="_blank" rel="noreferrer">
                      <Smartphone className="h-4 w-4 ml-2" />
                      بدء ربط واتساب
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <a href="/auto-setup" target="_blank" rel="noreferrer">
                      <Settings className="h-4 w-4 ml-2" />
                      إدارة الجلسات
                    </a>
                  </Button>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>تحذير:</strong> لا تستخدم رقمك الشخصي. استخدم رقم واتساب منفصل أو واتساب بيزنس لتجنب أي
                    مشاكل.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Step 5: Auto Setup */}
          <TabsContent value="auto-setup">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  التنصيب التلقائي
                </CardTitle>
                <CardDescription>تشغيل الإعداد التلقائي وبدء البوت</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <Database className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                    <h4 className="font-medium">إنشاء الجداول</h4>
                    <p className="text-sm text-gray-600">جداول المجموعات والرسائل والإحصائيات</p>
                  </div>

                  <div className="text-center p-4 border rounded-lg">
                    <Settings className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <h4 className="font-medium">الإعدادات الافتراضية</h4>
                    <p className="text-sm text-gray-600">تكوين البوت بالقيم المثلى</p>
                  </div>

                  <div className="text-center p-4 border rounded-lg">
                    <Smartphone className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                    <h4 className="font-medium">استيراد الجلسة</h4>
                    <p className="text-sm text-gray-600">استيراد جلسة واتساب من متغيرات البيئة</p>
                  </div>
                </div>

                <Button onClick={runAutoSetup} size="lg" className="w-full">
                  <Play className="h-4 w-4 ml-2" />
                  تشغيل التنصيب التلقائي
                </Button>

                <div className="space-y-2">
                  <Button variant="outline" className="w-full" asChild>
                    <a href="/auto-setup" target="_blank" rel="noreferrer">
                      <Settings className="h-4 w-4 ml-2" />
                      إدارة التنصيب التلقائي
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <a href="/test" target="_blank" rel="noreferrer">
                      <MessageSquare className="h-4 w-4 ml-2" />
                      اختبار إرسال الرسائل
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>إجراءات سريعة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href="/database" target="_blank" rel="noreferrer">
                  قاعدة البيانات
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="/setup" target="_blank" rel="noreferrer">
                  ربط واتساب
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="/test" target="_blank" rel="noreferrer">
                  اختبار الرسائل
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="/status" target="_blank" rel="noreferrer">
                  حالة النظام
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>الخطوات التالية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">🚀 بعد الإعداد</h4>
                <ul className="text-sm space-y-1">
                  <li>• اختبر البوت في صفحة /test</li>
                  <li>• راقب الحالة في صفحة /status</li>
                  <li>• أضف المجموعات في صفحة /</li>
                  <li>• اضبط الإعدادات حسب احتياجاتك</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">📚 موارد مفيدة</h4>
                <ul className="text-sm space-y-1">
                  <li>
                    •{" "}
                    <a href="/api/health" className="text-blue-600">
                      فحص صحة النظام
                    </a>
                  </li>
                  <li>
                    •{" "}
                    <a href="https://core.telegram.org/bots" className="text-blue-600">
                      وثائق تلقرام
                    </a>
                  </li>
                  <li>
                    •{" "}
                    <a href="https://supabase.com/docs" className="text-blue-600">
                      وثائق Supabase
                    </a>
                  </li>
                  <li>
                    •{" "}
                    <a href="https://vercel.com/docs" className="text-blue-600">
                      وثائق Vercel
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
