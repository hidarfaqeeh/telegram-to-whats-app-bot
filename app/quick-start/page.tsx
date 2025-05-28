"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Zap,
  CheckCircle,
  ExternalLink,
  Copy,
  Database,
  MessageSquare,
  Smartphone,
  Settings,
  Play,
  BookOpen,
} from "lucide-react"

export default function QuickStartPage() {
  const [copiedStep, setCopiedStep] = useState<string | null>(null)

  const copyToClipboard = (text: string, stepId: string) => {
    navigator.clipboard.writeText(text)
    setCopiedStep(stepId)
    setTimeout(() => setCopiedStep(null), 2000)
  }

  const quickStartSteps = [
    {
      id: "database",
      title: "1. إعداد قاعدة البيانات",
      description: "إنشاء قاعدة بيانات Supabase مجانية",
      time: "5 دقائق",
      action: "إنشاء مشروع Supabase",
      link: "https://supabase.com/dashboard",
    },
    {
      id: "telegram",
      title: "2. إنشاء بوت تلقرام",
      description: "الحصول على توكن البوت من BotFather",
      time: "3 دقائق",
      action: "إنشاء بوت جديد",
      link: "https://t.me/BotFather",
    },
    {
      id: "deploy",
      title: "3. نشر التطبيق",
      description: "نشر البوت على Vercel",
      time: "2 دقيقة",
      action: "نشر على Vercel",
      link: "#",
    },
    {
      id: "whatsapp",
      title: "4. ربط واتساب",
      description: "مسح QR Code وربط واتساب",
      time: "2 دقيقة",
      action: "ربط واتساب",
      link: "/setup",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">⚡ البدء السريع</h1>
          <p className="text-gray-600">اجعل البوت يعمل في أقل من 15 دقيقة</p>
        </div>

        {/* Quick Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              نظرة سريعة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {quickStartSteps.map((step, index) => (
                <div key={step.id} className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-1">{index + 1}</div>
                  <h4 className="font-medium text-sm mb-1">{step.title.split(". ")[1]}</h4>
                  <p className="text-xs text-gray-600 mb-2">{step.description}</p>
                  <Badge variant="outline" className="text-xs">
                    {step.time}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Detailed Steps */}
        <Tabs defaultValue="database" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="database" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              قاعدة البيانات
            </TabsTrigger>
            <TabsTrigger value="telegram" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              تلقرام
            </TabsTrigger>
            <TabsTrigger value="deploy" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              النشر
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              واتساب
            </TabsTrigger>
          </TabsList>

          {/* Database Setup */}
          <TabsContent value="database">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  إعداد قاعدة البيانات (5 دقائق)
                </CardTitle>
                <CardDescription>إنشاء قاعدة بيانات Supabase مجانية</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">📝 الخطوات</h4>
                    <ol className="text-sm space-y-1 list-decimal list-inside">
                      <li>اذهب إلى Supabase.com</li>
                      <li>أنشئ حساب جديد أو سجل دخول</li>
                      <li>اضغط "New Project"</li>
                      <li>اختر اسم للمشروع وكلمة مرور</li>
                      <li>انتظر حتى يتم إنشاء المشروع</li>
                      <li>انسخ URL و Service Role Key</li>
                    </ol>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">🔧 متغيرات البيئة</h4>
                    <div className="bg-gray-50 p-3 rounded font-mono text-xs space-y-1">
                      <div>NEXT_PUBLIC_SUPABASE_URL=your_url_here</div>
                      <div>SUPABASE_SERVICE_ROLE_KEY=your_key_here</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 w-full"
                      onClick={() =>
                        copyToClipboard(
                          `NEXT_PUBLIC_SUPABASE_URL=your_url_here
SUPABASE_SERVICE_ROLE_KEY=your_key_here`,
                          "database",
                        )
                      }
                    >
                      <Copy className="h-4 w-4 ml-2" />
                      {copiedStep === "database" ? "تم النسخ!" : "نسخ"}
                    </Button>
                  </div>
                </div>

                <Button className="w-full" asChild>
                  <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4 ml-2" />
                    إنشاء مشروع Supabase
                  </a>
                </Button>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>مجاني:</strong> Supabase يوفر 500MB مجاناً، وهو أكثر من كافي لبدء البوت.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Telegram Setup */}
          <TabsContent value="telegram">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  إعداد بوت تلقرام (3 دقائق)
                </CardTitle>
                <CardDescription>إنشاء بوت والحصول على التوكن</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">🤖 إنشاء البوت</h4>
                    <ol className="text-sm space-y-1 list-decimal list-inside">
                      <li>ابحث عن @BotFather في تلقرام</li>
                      <li>أرسل /newbot</li>
                      <li>اختر اسماً للبوت (مثل: My Channel Bot)</li>
                      <li>اختر معرفاً (مثل: mychannelbot)</li>
                      <li>احفظ التوكن الذي ستحصل عليه</li>
                    </ol>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">📢 إعداد القناة</h4>
                    <ol className="text-sm space-y-1 list-decimal list-inside">
                      <li>أنشئ قناة تلقرام جديدة</li>
                      <li>اذهب إلى إعدادات القناة</li>
                      <li>اضغط "Administrators"</li>
                      <li>أضف البوت كمشرف</li>
                      <li>امنحه صلاحية "Post Messages"</li>
                    </ol>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">🔧 متغيرات البيئة</h4>
                  <div className="bg-gray-50 p-3 rounded font-mono text-xs space-y-1">
                    <div>TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz</div>
                    <div>TELEGRAM_CHANNEL_ID=@yourchannel</div>
                    <div>ADMIN_CHAT_ID=123456789</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full"
                    onClick={() =>
                      copyToClipboard(
                        `TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHANNEL_ID=@yourchannel
ADMIN_CHAT_ID=123456789`,
                        "telegram",
                      )
                    }
                  >
                    <Copy className="h-4 w-4 ml-2" />
                    {copiedStep === "telegram" ? "تم النسخ!" : "نسخ المثال"}
                  </Button>
                </div>

                <Button className="w-full" asChild>
                  <a href="https://t.me/BotFather" target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4 ml-2" />
                    إنشاء بوت مع BotFather
                  </a>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deploy */}
          <TabsContent value="deploy">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  نشر التطبيق (2 دقيقة)
                </CardTitle>
                <CardDescription>نشر البوت على Vercel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    ✅ <strong>تم بالفعل!</strong> تم إضافة جميع متغيرات البيئة إلى مشروع Vercel الخاص بك.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">✅ ما تم إنجازه</h4>
                    <ul className="text-sm space-y-1">
                      <li>• تم نشر الكود على Vercel</li>
                      <li>• تم إضافة جميع متغيرات البيئة</li>
                      <li>• البوت جاهز للتشغيل</li>
                      <li>• يحتاج فقط لإعداد قاعدة البيانات</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">🔄 الخطوات التالية</h4>
                    <ul className="text-sm space-y-1">
                      <li>• حدث متغيرات قاعدة البيانات</li>
                      <li>• حدث توكن تلقرام</li>
                      <li>• شغل الإعداد التلقائي</li>
                      <li>• اربط واتساب</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button className="w-full" asChild>
                    <a href="/setup-guide">
                      <Settings className="h-4 w-4 ml-2" />
                      دليل الإعداد الكامل
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <a href="/auto-setup">
                      <Zap className="h-4 w-4 ml-2" />
                      التنصيب التلقائي
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* WhatsApp Setup */}
          <TabsContent value="whatsapp">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  ربط واتساب (2 دقيقة)
                </CardTitle>
                <CardDescription>مسح QR Code وربط واتساب</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">📱 المتطلبات</h4>
                    <ul className="text-sm space-y-1">
                      <li>• رقم واتساب منفصل</li>
                      <li>• يُفضل واتساب بيزنس</li>
                      <li>• هاتف متصل بالإنترنت</li>
                      <li>• عدم فتح واتساب ويب في مكان آخر</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">🔗 خطوات الربط</h4>
                    <ol className="text-sm space-y-1 list-decimal list-inside">
                      <li>اذهب إلى صفحة الإعداد</li>
                      <li>اضغط "اتصال"</li>
                      <li>امسح QR Code بواتساب</li>
                      <li>انتظر رسالة "تم الاتصال"</li>
                      <li>البوت جاهز للعمل!</li>
                    </ol>
                  </div>
                </div>

                <Button className="w-full" asChild>
                  <a href="/setup">
                    <Smartphone className="h-4 w-4 ml-2" />
                    بدء ربط واتساب
                  </a>
                </Button>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>نصيحة:</strong> بعد الربط، يمكنك تصدير الجلسة لاستخدامها تلقائياً في المرات القادمة.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Final Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              بعد الانتهاء
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">🧪 اختبار البوت</h4>
                <ul className="text-sm space-y-1">
                  <li>• اذهب إلى صفحة /test</li>
                  <li>• أرسل رسالة تجريبية</li>
                  <li>• تحقق من وصولها للمجموعات</li>
                  <li>• اضبط الإعدادات حسب الحاجة</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">📊 مراقبة الأداء</h4>
                <ul className="text-sm space-y-1">
                  <li>• راقب الحالة في /status</li>
                  <li>• تحقق من السجلات</li>
                  <li>• راقب الإحصائيات</li>
                  <li>• اضبط التأخير حسب الحاجة</li>
                </ul>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
              <Button variant="outline" size="sm" asChild>
                <a href="/test">اختبار</a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="/status">الحالة</a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="/">لوحة التحكم</a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="/setup-guide">الدليل الكامل</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
