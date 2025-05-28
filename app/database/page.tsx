"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Database, CheckCircle, XCircle, RefreshCw, TestTube, Info } from "lucide-react"

interface DatabaseStatus {
  connected: boolean
  type: string
  host: string
  port: number
  database: string
  ssl: boolean
  error?: string
}

interface TestResults {
  connected: boolean
  saveTest: boolean
  retrieveTest: boolean
  totalGroups: number
}

export default function DatabasePage() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null)
  const [testResults, setTestResults] = useState<TestResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)

  const fetchStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/database/status")
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error("خطأ في جلب حالة قاعدة البيانات:", error)
    } finally {
      setLoading(false)
    }
  }

  const testDatabase = async () => {
    setTesting(true)
    try {
      const response = await fetch("/api/database/test", { method: "POST" })
      const data = await response.json()

      if (data.success) {
        setTestResults(data.testResults)
      } else {
        alert(`فشل الاختبار: ${data.message}`)
      }
    } catch (error) {
      console.error("خطأ في اختبار قاعدة البيانات:", error)
      alert("خطأ في اختبار قاعدة البيانات")
    } finally {
      setTesting(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const getStatusColor = (connected: boolean) => {
    return connected ? "default" : "destructive"
  }

  const getStatusIcon = (connected: boolean) => {
    return connected ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />
  }

  const getDatabaseTypeInfo = (type: string) => {
    switch (type) {
      case "postgresql":
        return {
          name: "PostgreSQL",
          description: "قاعدة بيانات علائقية قوية",
          icon: "🐘",
          features: ["SQL كامل", "أداء عالي", "دعم JSON", "نسخ احتياطي"],
        }
      case "mongodb":
        return {
          name: "MongoDB",
          description: "قاعدة بيانات NoSQL مرنة",
          icon: "🍃",
          features: ["مرونة البيانات", "توسع أفقي", "استعلامات سريعة", "دعم جغرافي"],
        }
      case "redis":
        return {
          name: "Redis",
          description: "قاعدة بيانات في الذاكرة",
          icon: "🔴",
          features: ["سرعة فائقة", "تخزين مؤقت", "نشر/اشتراك", "انتهاء صلاحية"],
        }
      case "mysql":
        return {
          name: "MySQL",
          description: "قاعدة بيانات علائقية شائعة",
          icon: "🐬",
          features: ["سهولة الاستخدام", "أداء جيد", "دعم واسع", "أدوات متقدمة"],
        }
      default:
        return {
          name: "غير معروف",
          description: "نوع قاعدة بيانات غير مدعوم",
          icon: "❓",
          features: [],
        }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">🗄️ إدارة قاعدة البيانات</h1>
          <p className="text-gray-600">مراقبة واختبار اتصال قاعدة البيانات</p>
        </div>

        {/* حالة الاتصال */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                حالة قاعدة البيانات
              </div>
              <Button variant="outline" size="sm" onClick={fetchStatus} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ml-2 ${loading ? "animate-spin" : ""}`} />
                تحديث
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {status ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status.connected)}
                    <Badge variant={getStatusColor(status.connected)}>{status.connected ? "متصل" : "غير متصل"}</Badge>
                  </div>
                  <Button onClick={testDatabase} disabled={testing || !status.connected}>
                    <TestTube className={`h-4 w-4 ml-2 ${testing ? "animate-pulse" : ""}`} />
                    {testing ? "جاري الاختبار..." : "اختبار الاتصال"}
                  </Button>
                </div>

                {status.connected && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">معلومات الاتصال</h4>
                      <div className="space-y-1 text-sm">
                        <p>
                          <strong>النوع:</strong> {getDatabaseTypeInfo(status.type).name}
                        </p>
                        <p>
                          <strong>الخادم:</strong> {status.host}
                        </p>
                        <p>
                          <strong>المنفذ:</strong> {status.port}
                        </p>
                        <p>
                          <strong>قاعدة البيانات:</strong> {status.database}
                        </p>
                        <p>
                          <strong>SSL:</strong> {status.ssl ? "مفعل" : "معطل"}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">مميزات النوع</h4>
                      <div className="space-y-1">
                        {getDatabaseTypeInfo(status.type).features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {status.error && (
                  <Alert>
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>خطأ:</strong> {status.error}
                    </AlertDescription>
                  </Alert>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>جاري تحميل حالة قاعدة البيانات...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* نتائج الاختبار */}
        {testResults && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                نتائج اختبار قاعدة البيانات
              </CardTitle>
              <CardDescription>آخر اختبار تم إجراؤه</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${testResults.connected ? "text-green-600" : "text-red-600"}`}>
                    {testResults.connected ? "✅" : "❌"}
                  </div>
                  <p className="text-sm text-gray-600">الاتصال</p>
                </div>

                <div className="text-center">
                  <div className={`text-2xl font-bold ${testResults.saveTest ? "text-green-600" : "text-red-600"}`}>
                    {testResults.saveTest ? "✅" : "❌"}
                  </div>
                  <p className="text-sm text-gray-600">حفظ البيانات</p>
                </div>

                <div className="text-center">
                  <div className={`text-2xl font-bold ${testResults.retrieveTest ? "text-green-600" : "text-red-600"}`}>
                    {testResults.retrieveTest ? "✅" : "❌"}
                  </div>
                  <p className="text-sm text-gray-600">استرجاع البيانات</p>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{testResults.totalGroups}</div>
                  <p className="text-sm text-gray-600">إجمالي المجموعات</p>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>نجاح الاختبارات</span>
                  <span>
                    {[testResults.connected, testResults.saveTest, testResults.retrieveTest].filter(Boolean).length}/3
                  </span>
                </div>
                <Progress
                  value={
                    ([testResults.connected, testResults.saveTest, testResults.retrieveTest].filter(Boolean).length /
                      3) *
                    100
                  }
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* معلومات قواعد البيانات المدعومة */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              قواعد البيانات المدعومة
            </CardTitle>
            <CardDescription>أنواع قواعد البيانات التي يمكن استخدامها مع البوت</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {["postgresql", "mongodb", "redis", "mysql"].map((type) => {
                const info = getDatabaseTypeInfo(type)
                return (
                  <div key={type} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{info.icon}</span>
                      <div>
                        <h4 className="font-medium">{info.name}</h4>
                        <p className="text-sm text-gray-600">{info.description}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {info.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* إرشادات الإعداد */}
        <Card>
          <CardHeader>
            <CardTitle>إرشادات الإعداد</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>للبدء:</strong> تأكد من إضافة متغيرات البيئة التالية:
                <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
                  <li>
                    <code>DATABASE_TYPE</code> - نوع قاعدة البيانات (postgresql, mongodb, redis, mysql)
                  </li>
                  <li>
                    <code>DATABASE_HOST</code> - عنوان الخادم
                  </li>
                  <li>
                    <code>DATABASE_PORT</code> - رقم المنفذ
                  </li>
                  <li>
                    <code>DATABASE_USERNAME</code> - اسم المستخدم
                  </li>
                  <li>
                    <code>DATABASE_PASSWORD</code> - كلمة المرور
                  </li>
                  <li>
                    <code>DATABASE_NAME</code> - اسم قاعدة البيانات
                  </li>
                  <li>
                    <code>DATABASE_SSL</code> - تفعيل SSL (true/false)
                  </li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">🏆 التوصيات</h4>
                <ul className="text-sm space-y-1">
                  <li>
                    • <strong>للبداية:</strong> PostgreSQL Micro في Northflank
                  </li>
                  <li>
                    • <strong>للأداء:</strong> PostgreSQL + Redis
                  </li>
                  <li>
                    • <strong>للمرونة:</strong> MongoDB
                  </li>
                  <li>
                    • <strong>للسرعة:</strong> Redis فقط
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">💰 البدائل المجانية</h4>
                <ul className="text-sm space-y-1">
                  <li>• Supabase (PostgreSQL مجاني)</li>
                  <li>• MongoDB Atlas (مجاني حتى 512MB)</li>
                  <li>• PlanetScale (MySQL مجاني)</li>
                  <li>• Redis Cloud (مجاني حتى 30MB)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
