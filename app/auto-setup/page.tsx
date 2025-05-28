"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Zap, Database, CheckCircle, XCircle, Loader2, AlertTriangle, ExternalLink, Edit } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export default function AutoSetupPage() {
  const [installing, setInstalling] = useState(false)
  const [installResult, setInstallResult] = useState<any>(null)
  const [envStatus, setEnvStatus] = useState<any>(null)
  const [manualMode, setManualMode] = useState(false)
  const [supabaseUrl, setSupabaseUrl] = useState("")
  const [supabaseKey, setSupabaseKey] = useState("")

  useEffect(() => {
    checkEnvironmentVariables()
  }, [])

  const checkEnvironmentVariables = async () => {
    try {
      const response = await fetch("/api/setup/check-env")
      const data = await response.json()
      setEnvStatus(data)
    } catch (error) {
      console.error("خطأ في فحص متغيرات البيئة:", error)
    }
  }

  const runAutoInstall = async () => {
    setInstalling(true)
    setInstallResult(null)

    try {
      console.log("🚀 بدء التنصيب التلقائي...")

      // If in manual mode, we'll use the manually entered credentials
      // Otherwise, we'll use the environment variables
      const requestBody = manualMode ? { supabaseUrl, supabaseKey } : {}

      const response = await fetch("/api/setup/auto-install", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      // Check content type
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        throw new Error(`Expected JSON response, got: ${text.substring(0, 200)}...`)
      }

      const result = await response.json()
      setInstallResult(result)

      if (result.success) {
        alert("✅ تم التنصيب التلقائي بنجاح!")
      } else {
        console.error("فشل التنصيب:", result)
      }
    } catch (error) {
      console.error("خطأ في التنصيب:", error)

      const errorMessage = error instanceof Error ? error.message : "خطأ غير معروف"

      setInstallResult({
        success: false,
        message: "خطأ في الاتصال بالخادم",
        error: errorMessage,
        details: {
          error_type: "NetworkError",
          timestamp: new Date().toISOString(),
        },
      })
    } finally {
      setInstalling(false)
    }
  }

  const hasPlaceholderValues = () => {
    if (!envStatus) return true

    const placeholders = ["your_", "example", "placeholder"]

    // Check if any present variables contain placeholder values
    return envStatus.present_vars?.some((varName: string) => {
      const value = process.env[varName]
      return placeholders.some((p) => value?.includes(p))
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">⚡ التنصيب التلقائي</h1>
          <p className="text-gray-600">إعداد قاعدة البيانات تلقائياً</p>
        </div>

        {/* Environment Variables Status */}
        {envStatus && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                حالة متغيرات البيئة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">✅ متغيرات موجودة ({envStatus.present})</h4>
                  <div className="text-sm space-y-1">
                    {envStatus.present_vars?.map((varName: string) => (
                      <div key={varName} className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        {varName}
                      </div>
                    ))}
                  </div>
                </div>

                {envStatus.missing_required?.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 text-red-600">❌ متغيرات مطلوبة مفقودة</h4>
                    <div className="text-sm space-y-1">
                      {envStatus.missing_required.map((varName: string) => (
                        <div key={varName} className="flex items-center gap-2">
                          <XCircle className="h-3 w-3 text-red-500" />
                          {varName}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {(envStatus.missing_required?.length > 0 || hasPlaceholderValues()) && (
                <Alert className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>تحذير:</strong> يبدو أن متغيرات البيئة غير مكتملة أو تحتوي على قيم افتراضية.
                    <br />
                    يمكنك إضافة المتغيرات في Vercel أو استخدام وضع الإدخال اليدوي أدناه.
                    <br />
                    <a
                      href="https://vercel.com/dashboard"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 underline inline-flex items-center gap-1 mt-1"
                    >
                      اذهب إلى Vercel Dashboard
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Manual Input Mode */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                وضع الإدخال اليدوي
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={manualMode} onCheckedChange={setManualMode} id="manual-mode" />
                <Label htmlFor="manual-mode">تفعيل</Label>
              </div>
            </CardTitle>
            <CardDescription>استخدم هذا الوضع إذا كنت تريد إدخال بيانات Supabase يدوياً</CardDescription>
          </CardHeader>
          {manualMode && (
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="supabase-url">رابط Supabase</Label>
                <Input
                  id="supabase-url"
                  placeholder="https://your-project.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                />
                <p className="text-xs text-gray-500">مثال: https://abcdefghijklm.supabase.co</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supabase-key">مفتاح Service Role</Label>
                <Input
                  id="supabase-key"
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                />
                <p className="text-xs text-gray-500">يمكنك الحصول عليه من لوحة تحكم Supabase &gt; Settings &gt; API</p>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>تنبيه:</strong> لن يتم حفظ هذه البيانات بشكل دائم. يُفضل إضافتها كمتغيرات بيئة في Vercel.
                </AlertDescription>
              </Alert>
            </CardContent>
          )}
        </Card>

        {/* التنصيب التلقائي */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              التنصيب التلقائي
            </CardTitle>
            <CardDescription>إنشاء جداول قاعدة البيانات وإعداد الإعدادات الافتراضية تلقائياً</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <Database className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <h4 className="font-medium">إنشاء الجداول</h4>
                <p className="text-sm text-gray-600">جداول المجموعات والرسائل والإحصائيات</p>
              </div>

              <div className="text-center p-4 border rounded-lg">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <h4 className="font-medium">الإعدادات الافتراضية</h4>
                <p className="text-sm text-gray-600">تكوين البوت بالقيم المثلى</p>
              </div>
            </div>

            <Button
              onClick={runAutoInstall}
              disabled={installing || (!manualMode && envStatus && envStatus.missing_required?.length > 0)}
              className="w-full"
              size="lg"
            >
              {installing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  جاري التنصيب...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 ml-2" />
                  بدء التنصيب التلقائي
                </>
              )}
            </Button>

            {!manualMode && envStatus && envStatus.missing_required?.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  يجب إضافة جميع متغيرات البيئة المطلوبة أو تفعيل وضع الإدخال اليدوي قبل بدء التنصيب.
                </AlertDescription>
              </Alert>
            )}

            {manualMode && (!supabaseUrl || !supabaseKey) && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>يرجى إدخال رابط Supabase ومفتاح Service Role.</AlertDescription>
              </Alert>
            )}

            {installResult && (
              <Alert>
                {installResult.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                <AlertDescription>
                  <strong>{installResult.success ? "نجح التنصيب:" : "فشل التنصيب:"}</strong>
                  <br />
                  {installResult.message}

                  {installResult.error && (
                    <div className="mt-2 p-2 bg-red-50 rounded text-sm">
                      <strong>تفاصيل الخطأ:</strong> {installResult.error}
                    </div>
                  )}

                  {installResult.details && (
                    <div className="mt-2 space-y-1 text-sm">
                      {installResult.details.solution && (
                        <div className="p-2 bg-blue-50 rounded">
                          <strong>💡 الحل:</strong> {installResult.details.solution}
                        </div>
                      )}

                      <div>• إعداد قاعدة البيانات: {installResult.details.database_setup ? "✅" : "❌"}</div>
                      <div>• نوع قاعدة البيانات: {installResult.details.database_type || "غير محدد"}</div>

                      {installResult.details.success_rate && (
                        <div>• معدل النجاح: {installResult.details.success_rate}</div>
                      )}

                      {installResult.details.tables_created && installResult.details.tables_created.length > 0 && (
                        <div>• الجداول المُنشأة: {installResult.details.tables_created.join(", ")}</div>
                      )}

                      {installResult.details.tables_failed && installResult.details.tables_failed.length > 0 && (
                        <div className="text-red-600">
                          • الجداول الفاشلة:
                          {installResult.details.tables_failed.map((table: any, index: number) => (
                            <div key={index} className="ml-4">
                              - {table.name}: {table.error}
                              {table.suggestion && <div className="text-xs text-gray-600">💡 {table.suggestion}</div>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* معلومات إضافية */}
        <Card>
          <CardHeader>
            <CardTitle>معلومات التنصيب</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>ما يتم إنجازه:</strong>
                  <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
                    <li>فحص صحة متغيرات البيئة</li>
                    <li>اختبار الاتصال بـ Supabase</li>
                    <li>إنشاء جداول قاعدة البيانات</li>
                    <li>إعداد الإعدادات الافتراضية</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">📋 المتطلبات</h4>
                  <ul className="text-sm space-y-1">
                    <li>• حساب Supabase نشط</li>
                    <li>• رابط Supabase صحيح</li>
                    <li>• مفتاح Service Role</li>
                    <li>• صلاحيات كافية لإنشاء الجداول</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">🔄 بعد التنصيب</h4>
                  <ul className="text-sm space-y-1">
                    <li>• اختبر قاعدة البيانات في /database</li>
                    <li>• اربط واتساب في /setup</li>
                    <li>• اختبر الرسائل في /test</li>
                    <li>• راقب الحالة في /status</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* استكشاف الأخطاء */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              استكشاف الأخطاء
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-sm">❌ إذا فشل التنصيب:</h4>
                <ul className="text-sm space-y-1 mt-1 ml-4">
                  <li>• تحقق من صحة رابط Supabase (يجب أن يبدأ بـ https://)</li>
                  <li>• تأكد من صحة Service Role Key (وليس anon key)</li>
                  <li>• جرب الإعداد اليدوي في Supabase Dashboard</li>
                  <li>• تحقق من السجلات في وحدة التحكم</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-sm">🔧 خطوات بديلة:</h4>
                <ul className="text-sm space-y-1 mt-1 ml-4">
                  <li>• اذهب إلى /database لاختبار الاتصال</li>
                  <li>• استخدم /setup-guide للإعداد اليدوي</li>
                  <li>• راجع /quick-start للبدء من جديد</li>
                  <li>• أنشئ الجداول يدوياً في Supabase</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
