"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowRight,
  Mail,
  Lock,
  Shield,
  CheckCircle,
  KeyRound,
  Eye,
  EyeOff,
  RefreshCw,
  ArrowLeft,
  Timer,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Step = "email" | "otp" | "new-password" | "success";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [resetToken, setResetToken] = useState("");
  const [debugOtp, setDebugOtp] = useState<string | null>(null);

  const handleEmailSubmit = async () => {
    if (!email || !email.includes("@")) {
      toast.error("يرجى إدخال بريد إلكتروني صحيح");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (data.success) {
        setStep("otp");
        startResendTimer();
        toast.success(data.message || "تم إرسال رمز التحقق إلى بريدك الإلكتروني");
        // Show debug OTP in development
        if (data.debug_otp) {
          setDebugOtp(data.debug_otp);
        }
      } else {
        toast.error(data.error || "فشل في إرسال رمز التحقق");
      }
    } catch {
      toast.error("حدث خطأ أثناء إرسال رمز التحقق");
    } finally {
      setLoading(false);
    }
  };

  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newOtp = [...otp];
      pasted.split('').forEach((char, i) => {
        if (i < 6) newOtp[i] = char;
      });
      setOtp(newOtp);
      // Focus last filled input
      const lastIndex = Math.min(pasted.length - 1, 5);
      document.getElementById(`otp-${lastIndex}`)?.focus();
    }
  };

  const getPasswordStrength = (password: string) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const handleOtpSubmit = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      toast.error("يرجى إدخال رمز التحقق كاملاً");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpCode }),
      });
      const data = await response.json();

      if (data.success) {
        setResetToken(data.resetToken);
        setStep("new-password");
        toast.success("تم التحقق بنجاح");
      } else {
        toast.error(data.error || "رمز التحقق غير صحيح");
      }
    } catch {
      toast.error("حدث خطأ أثناء التحقق من الرمز");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async () => {
    if (newPassword.length < 8) {
      toast.error("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("كلمة المرور غير متطابقة");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, resetToken, newPassword }),
      });
      const data = await response.json();

      if (data.success) {
        setStep("success");
        toast.success("تم تغيير كلمة المرور بنجاح!");
      } else {
        toast.error(data.error || "فشل في تغيير كلمة المرور");
      }
    } catch {
      toast.error("حدث خطأ أثناء تغيير كلمة المرور");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (data.success) {
        startResendTimer();
        toast.success("تم إعادة إرسال رمز التحقق");
        if (data.debug_otp) {
          setDebugOtp(data.debug_otp);
        }
      } else {
        toast.error(data.error || "فشل في إعادة الإرسال");
      }
    } catch {
      toast.error("حدث خطأ أثناء إعادة الإرسال");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 bg-card/95 backdrop-blur-lg border-b border-border z-50">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => {
              if (step === "email") router.back();
              else if (step === "otp") setStep("email");
              else if (step === "new-password") setStep("otp");
            }}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-lg">استعادة كلمة المرور</h1>
          <div className="w-9" />
        </div>
      </header>

      <div className="flex-1 px-4 py-8 flex flex-col justify-center max-w-md mx-auto w-full">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {(["email", "otp", "new-password", "success"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                  step === s
                    ? "bg-primary text-primary-foreground"
                    : ["email", "otp", "new-password", "success"].indexOf(step) > i
                    ? "bg-green-500 text-white"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {["email", "otp", "new-password", "success"].indexOf(step) > i ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  i + 1
                )}
              </div>
              {i < 3 && (
                <div
                  className={cn(
                    "w-8 h-1 transition-colors",
                    ["email", "otp", "new-password", "success"].indexOf(step) > i
                      ? "bg-green-500"
                      : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Debug OTP Banner */}
        {debugOtp && step === "otp" && (
          <Card className="p-4 mb-4 bg-yellow-50 border-yellow-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-800">وضع التطوير</p>
                <p className="text-xs text-yellow-700">
                  رمز التحقق: <span className="font-bold">{debugOtp}</span>
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Email Step */}
        {step === "email" && (
          <Card className="p-6 card-shadow animate-in slide-in-from-right duration-300">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">أدخل بريدك الإلكتروني</h2>
              <p className="text-muted-foreground text-sm">
                سنرسل لك رمز التحقق لاستعادة كلمة المرور
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">البريد الإلكتروني</label>
                <div className="relative">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="bg-secondary border-0 rounded-xl pr-10"
                    dir="ltr"
                  />
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              <Button
                onClick={handleEmailSubmit}
                className="w-full h-12 rounded-xl bg-primary"
                disabled={loading}
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    إرسال رمز التحقق
                    <ArrowLeft className="w-4 h-4 mr-2" />
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* OTP Step */}
        {step === "otp" && (
          <Card className="p-6 card-shadow animate-in slide-in-from-right duration-300">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <KeyRound className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">أدخل رمز التحقق</h2>
              <p className="text-muted-foreground text-sm">
                تم إرسال رمز التحقق إلى
                <br />
                <span className="font-medium text-foreground">{email}</span>
              </p>
            </div>

            <div className="space-y-6">
              {/* OTP Inputs */}
              <div className="flex justify-center gap-2" dir="ltr">
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={index === 0 ? handleOtpPaste : undefined}
                    className="w-12 h-14 text-center text-xl font-bold bg-secondary border-0 rounded-xl focus:ring-2 focus:ring-primary"
                  />
                ))}
              </div>

              {/* Resend */}
              <div className="text-center">
                {resendTimer > 0 ? (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                    <Timer className="w-4 h-4" />
                    <span>إعادة الإرسال خلال {resendTimer} ثانية</span>
                  </div>
                ) : (
                  <button
                    onClick={handleResendOtp}
                    className="text-primary font-medium text-sm hover:underline"
                    disabled={loading}
                  >
                    إعادة إرسال الرمز
                  </button>
                )}
              </div>

              <Button
                onClick={handleOtpSubmit}
                className="w-full h-12 rounded-xl bg-primary"
                disabled={loading}
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    تحقق
                    <ArrowLeft className="w-4 h-4 mr-2" />
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* New Password Step */}
        {step === "new-password" && (
          <Card className="p-6 card-shadow animate-in slide-in-from-right duration-300">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">كلمة مرور جديدة</h2>
              <p className="text-muted-foreground text-sm">
                أدخل كلمة مرور جديدة لحسابك
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">كلمة المرور الجديدة</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-secondary border-0 rounded-xl pl-10"
                    dir="ltr"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">تأكيد كلمة المرور</label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-secondary border-0 rounded-xl pl-10"
                    dir="ltr"
                  />
                  <button
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password strength indicator */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">قوة كلمة المرور</span>
                  {newPassword.length > 0 && (
                    <span className={getPasswordStrength(newPassword) >= 3 ? "text-green-600" : getPasswordStrength(newPassword) === 2 ? "text-yellow-600" : "text-red-600"}>
                      {getPasswordStrength(newPassword) >= 4 ? 'قوية جداً' : getPasswordStrength(newPassword) === 3 ? 'قوية' : getPasswordStrength(newPassword) === 2 ? 'متوسطة' : 'ضعيفة'}
                    </span>
                  )}
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-300 rounded-full ${getPasswordStrength(newPassword) >= 4 ? 'bg-green-500 w-full' : getPasswordStrength(newPassword) === 3 ? 'bg-blue-500 w-3/4' : getPasswordStrength(newPassword) === 2 ? 'bg-yellow-500 w-1/2' : 'bg-red-500 w-1/4'}`} />
                </div>
                {newPassword.length > 0 && (
                  <ul className="text-xs text-muted-foreground space-y-1 mt-1">
                    <li className={newPassword.length >= 8 ? "text-green-600" : ""}>
                      {newPassword.length >= 8 ? "✓" : "○"} 8 أحرف على الأقل
                    </li>
                    <li className={/[A-Z]/.test(newPassword) ? "text-green-600" : ""}>
                      {/[A-Z]/.test(newPassword) ? "✓" : "○"} حرف كبير واحد على الأقل
                    </li>
                    <li className={/[0-9]/.test(newPassword) ? "text-green-600" : ""}>
                      {/[0-9]/.test(newPassword) ? "✓" : "○"} رقم واحد على الأقل
                    </li>
                  </ul>
                )}
              </div>

              <Button
                onClick={handlePasswordSubmit}
                className="w-full h-12 rounded-xl bg-primary"
                disabled={loading}
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    حفظ كلمة المرور
                    <ArrowLeft className="w-4 h-4 mr-2" />
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* Success Step */}
        {step === "success" && (
          <Card className="p-6 card-shadow text-center animate-in zoom-in duration-300">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">تم بنجاح!</h2>
            <p className="text-muted-foreground mb-6">
              تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة.
            </p>
            <Button
              onClick={() => router.push("/login")}
              className="w-full h-12 rounded-xl bg-primary"
            >
              تسجيل الدخول
              <ArrowLeft className="w-4 h-4 mr-2" />
            </Button>
          </Card>
        )}

        {/* Security notice */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Shield className="w-4 h-4 text-primary" />
          <span>محمي بتشفير AES-256</span>
        </div>
      </div>
    </main>
  );
}
