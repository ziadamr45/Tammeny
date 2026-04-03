"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

  const handleEmailSubmit = async () => {
    if (!email || !email.includes("@")) {
      toast.error("يرجى إدخال بريد إلكتروني صحيح");
      return;
    }
    setLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setLoading(false);
    setStep("otp");
    startResendTimer();
    toast.success("تم إرسال رمز التحقق إلى بريدك الإلكتروني");
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

  const handleOtpSubmit = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      toast.error("يرجى إدخال رمز التحقق كاملاً");
      return;
    }
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setLoading(false);
    setStep("new-password");
    toast.success("تم التحقق بنجاح");
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
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setLoading(false);
    setStep("success");
    toast.success("تم تغيير كلمة المرور بنجاح!");
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoading(false);
    startResendTimer();
    toast.success("تم إعادة إرسال رمز التحقق");
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
                  <span
                    className={cn(
                      newPassword.length >= 8
                        ? "text-green-600"
                        : newPassword.length >= 4
                        ? "text-yellow-600"
                        : "text-red-600"
                    )}
                  >
                    {newPassword.length >= 8 ? "قوية" : newPassword.length >= 4 ? "متوسطة" : "ضعيفة"}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-300",
                      newPassword.length >= 8
                        ? "bg-green-500 w-full"
                        : newPassword.length >= 4
                        ? "bg-yellow-500 w-1/2"
                        : "bg-red-500 w-1/4"
                    )}
                  />
                </div>
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
