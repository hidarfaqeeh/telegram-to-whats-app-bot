import { WhatsAppConnection } from "@/components/whatsapp-connection"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InfoIcon, Smartphone, Shield, Zap } from "lucide-react"

export default function SetupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">🔧 إعداد البوت</h1>
          <p className="text-gray-600">قم بربط واتساب وتكوين البوت</p>
        </div>

        {/* تحذير مهم */}
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            <strong>مهم:</strong> تأكد من أن لديك رقم واتساب منفصل للبوت، أو استخدم واتساب بيزنس. لا تستخدم رقمك الشخصي
            لتجنب أي مشاكل.
          </AlertDescription>
        </Alert>

        {/* مميزات الاتصال */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="text-center">
              <Smartphone className="h-8 w-8 mx-auto text-blue-500" />
              <CardTitle className="text-lg">سهولة الاتصال</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 text-center">مسح QR Code واحد فقط للاتصال بواتساب</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Shield className="h-8 w-8 mx-auto text-green-500" />
              <CardTitle className="text-lg">آمان وموثوق</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 text-center">جلسة محفوظة محلياً بدون تخزين كلمات المرور</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Zap className="h-8 w-8 mx-auto text-yellow-500" />
              <CardTitle className="text-lg">أداء عالي</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 text-center">إرسال سريع ومستقر لجميع المجموعات</p>
            </CardContent>
          </Card>
        </div>

        {/* واجهة ربط واتساب */}
        <WhatsAppConnection />

        {/* نصائح وإرشادات */}
        <Card>
          <CardHeader>
            <CardTitle>💡 نصائح مهمة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-green-700">✅ افعل</h4>
                <ul className="text-sm space-y-1 mt-2">
                  <li>• استخدم رقم واتساب منفصل للبوت</li>
                  <li>• تأكد من استقرار الإنترنت</li>
                  <li>• اجعل الهاتف متصلاً بالإنترنت</li>
                  <li>• استخدم واتساب بيزنس إن أمكن</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-red-700">❌ لا تفعل</h4>
                <ul className="text-sm space-y-1 mt-2">
                  <li>• لا تستخدم رقمك الشخصي</li>
                  <li>• لا تفتح واتساب ويب في مكان آخر</li>
                  <li>• لا ترسل رسائل كثيرة بسرعة</li>
                  <li>• لا تشارك معلومات الجلسة</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
