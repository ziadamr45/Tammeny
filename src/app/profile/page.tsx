"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Camera,
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Bell,
  Eye,
  EyeOff,
  Check,
  X,
  Edit3,
  Save,
  Trash2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  avatar: string | null;
  address: string;
  gender: "male" | "female";
  notifications: boolean;
  ghostMode: boolean;
}

const INITIAL_PROFILE: UserProfile = {
  name: "أحمد محمد",
  email: "ahmed@example.com",
  phone: "+20 123 456 7890",
  avatar: null,
  address: "القاهرة، مصر",
  gender: "male",
  notifications: true,
  ghostMode: false,
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [localProfileOverrides, setLocalProfileOverrides] = useState<Partial<UserProfile>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Compute profile from user data with local overrides
  const profile = useMemo<UserProfile>(() => {
    const baseProfile: UserProfile = user ? {
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      avatar: user.avatar,
      address: "",
      gender: (user.gender as "male" | "female") || "male",
      notifications: true,
      ghostMode: false,
    } : INITIAL_PROFILE;
    return { ...baseProfile, ...localProfileOverrides };
  }, [user, localProfileOverrides]);

  const handleEdit = () => {
    setEditedProfile(profile);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedProfile(profile);
  };

  const handleSaveEdit = async () => {
    try {
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editedProfile.name,
          email: editedProfile.email,
          phone: editedProfile.phone,
          avatar: editedProfile.avatar,
          gender: editedProfile.gender,
          address: editedProfile.address,
          notifications: editedProfile.notifications,
          ghostMode: editedProfile.ghostMode,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setLocalProfileOverrides(editedProfile);
        setIsEditing(false);
        toast.success("تم حفظ التغييرات بنجاح!");
      } else {
        toast.error(data.error || "فشل في حفظ التغييرات");
      }
    } catch {
      toast.error("حدث خطأ أثناء الحفظ");
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error("يرجى اختيار ملف صورة صالح");
      return;
    }

    // Check file size (max 5MB raw)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الصورة يجب أن يكون أقل من 5 ميجابايت");
      return;
    }

    setIsUploadingAvatar(true);

    try {
      // Read and compress image
      const compressedBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            // Resize to max 400x400 for better quality while keeping size small
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 400;
            let { width, height } = img;
            
            if (width > height) {
              if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
            } else {
              if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              // Start with quality 0.8, reduce if needed
              let quality = 0.8;
              let compressed = canvas.toDataURL('image/jpeg', quality);
              
              // Reduce quality if still too large (max 200KB)
              while (compressed.length > 200000 && quality > 0.1) {
                quality -= 0.1;
                compressed = canvas.toDataURL('image/jpeg', quality);
              }
              
              resolve(compressed);
            } else {
              reject(new Error('فشل في معالجة الصورة'));
            }
          };
          img.onerror = () => reject(new Error('فشل في تحميل الصورة'));
          img.src = reader.result as string;
        };
        reader.onerror = () => reject(new Error('فشل في قراءة الملف'));
        reader.readAsDataURL(file);
      });

      // Send to API
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: compressedBase64 }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        if (isEditing) {
          setEditedProfile({ ...editedProfile, avatar: compressedBase64 });
        } else {
          setLocalProfileOverrides({ ...localProfileOverrides, avatar: compressedBase64 });
        }
        toast.success("تم تحديث الصورة الشخصية بنجاح!");
      } else {
        toast.error(data.error || "فشل في تحديث الصورة");
      }
    } catch {
      toast.error("حدث خطأ أثناء معالجة الصورة");
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleChangePassword = async () => {
    if (!passwords.current) {
      toast.error("يرجى إدخال كلمة المرور الحالية");
      return;
    }
    if (passwords.new !== passwords.confirm) {
      toast.error("كلمة المرور الجديدة غير متطابقة!");
      return;
    }
    if (passwords.new.length < 8) {
      toast.error("كلمة المرور يجب أن تكون 8 أحرف على الأقل!");
      return;
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.new,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setShowPasswordDialog(false);
        setPasswords({ current: '', new: '', confirm: '' });
        toast.success("تم تغيير كلمة المرور بنجاح!");
      } else {
        toast.error(data.error || "فشل في تغيير كلمة المرور");
      }
    } catch {
      toast.error("حدث خطأ أثناء تغيير كلمة المرور");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const response = await fetch('/api/user', { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        setShowDeleteDialog(false);
        await fetch('/api/auth/logout', { method: 'POST' });
        toast.success("تم حذف الحساب بنجاح");
        router.push('/login');
      } else {
        toast.error(data.error || "فشل في حذف الحساب");
      }
    } catch {
      toast.error("حدث خطأ أثناء حذف الحساب");
    }
  };

  return (
    <main className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-card/95 backdrop-blur-lg border-b border-border z-50">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-lg">الملف الشخصي</h1>
          {isEditing ? (
            <button
              onClick={handleSaveEdit}
              className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Check className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleEdit}
              className="p-2 rounded-full hover:bg-muted transition-colors"
            >
              <Edit3 className="w-5 h-5 text-primary" />
            </button>
          )}
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Auth Loading State */}
        {authLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">جاري التحميل...</p>
          </div>
        )}

        {/* Content - only show when authenticated */}
        {!authLoading && isAuthenticated && (
          <>
            {/* Avatar Section */}
            <Card className="p-6 card-shadow text-center">
              <div className="relative inline-block">
                <Avatar className="w-28 h-28 border-4 border-primary/20 mx-auto cursor-pointer group" onClick={handleAvatarClick}>
                  <AvatarImage src={profile.avatar || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-teal-dark text-primary-foreground text-4xl font-bold">
                    {profile.name[0]}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={handleAvatarClick}
              disabled={isUploadingAvatar}
              className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploadingAvatar ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          
          <h2 className="text-xl font-bold mt-4">{profile.name}</h2>
          <p className="text-muted-foreground text-sm">{profile.email}</p>
          
          <div className="flex items-center justify-center gap-2 mt-3">
            <Badge variant="secondary" className="bg-primary/10 text-primary gap-1">
              <Shield className="w-3 h-3" />
              موثق
            </Badge>
            <Badge variant="secondary" className="gap-1">
              {profile.gender === "male" ? "ذكر" : "أنثى"}
            </Badge>
          </div>
        </Card>

        {/* Profile Form */}
        <Card className="p-4 card-shadow space-y-4">
          <h3 className="font-bold flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            معلومات شخصية
          </h3>

          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">الاسم الكامل</label>
              {isEditing ? (
                <Input
                  value={editedProfile.name}
                  onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                  className="bg-secondary border-0 rounded-xl"
                />
              ) : (
                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">{profile.name}</span>
                </div>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">البريد الإلكتروني</label>
              {isEditing ? (
                <Input
                  type="email"
                  value={editedProfile.email}
                  onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                  className="bg-secondary border-0 rounded-xl"
                />
              ) : (
                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">{profile.email}</span>
                </div>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">رقم الهاتف</label>
              {isEditing ? (
                <Input
                  type="tel"
                  value={editedProfile.phone}
                  onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                  className="bg-secondary border-0 rounded-xl"
                  dir="ltr"
                />
              ) : (
                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium" dir="ltr">{profile.phone}</span>
                </div>
              )}
            </div>

            {/* Address */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">العنوان</label>
              {isEditing ? (
                <Input
                  value={editedProfile.address}
                  onChange={(e) => setEditedProfile({ ...editedProfile, address: e.target.value })}
                  className="bg-secondary border-0 rounded-xl"
                />
              ) : (
                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">{profile.address}</span>
                </div>
              )}
            </div>

            {/* Gender */}
            {isEditing && (
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">الجنس</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setEditedProfile({ ...editedProfile, gender: "male" })}
                    className={cn(
                      "flex-1 p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2",
                      editedProfile.gender === "male"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <User className="w-5 h-5" />
                    ذكر
                  </button>
                  <button
                    onClick={() => setEditedProfile({ ...editedProfile, gender: "female" })}
                    className={cn(
                      "flex-1 p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2",
                      editedProfile.gender === "female"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <User className="w-5 h-5" />
                    أنثى
                  </button>
                </div>
              </div>
            )}
          </div>

          {isEditing && (
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                className="flex-1 rounded-xl"
              >
                <X className="w-4 h-4 ml-2" />
                إلغاء
              </Button>
              <Button
                onClick={handleSaveEdit}
                className="flex-1 rounded-xl bg-primary"
              >
                <Save className="w-4 h-4 ml-2" />
                حفظ
              </Button>
            </div>
          )}
        </Card>

        {/* Settings */}
        <Card className="p-4 card-shadow space-y-4">
          <h3 className="font-bold flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            إعدادات الأمان
          </h3>

          <div className="space-y-3">
            {/* Change Password */}
            <button
              onClick={() => setShowPasswordDialog(true)}
              className="w-full flex items-center gap-3 p-3 bg-secondary/50 rounded-xl hover:bg-secondary transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1 text-right">
                <div className="font-medium">تغيير كلمة المرور</div>
                <div className="text-xs text-muted-foreground">تحديث كلمة المرور للحماية</div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Notifications */}
            <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium">الإشعارات</div>
                <div className="text-xs text-muted-foreground">تفعيل تنبيهات الوصول</div>
              </div>
              <button
                onClick={() => {
                  setLocalProfileOverrides({ ...localProfileOverrides, notifications: !profile.notifications });
                  toast.success(profile.notifications ? "تم إيقاف الإشعارات" : "تم تفعيل الإشعارات");
                }}
                className={cn(
                  "w-12 h-6 rounded-full transition-colors relative",
                  profile.notifications ? "bg-primary" : "bg-muted"
                )}
              >
                <div
                  className={cn(
                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                    profile.notifications ? "right-1" : "right-7"
                  )}
                />
              </button>
            </div>

            {/* Ghost Mode */}
            <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Eye className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium">الوضع الخفي</div>
                <div className="text-xs text-muted-foreground">مشاركة موقع تقريبي</div>
              </div>
              <button
                onClick={() => {
                  setLocalProfileOverrides({ ...localProfileOverrides, ghostMode: !profile.ghostMode });
                  toast.success(profile.ghostMode ? "تم إيقاف الوضع الخفي" : "تم تفعيل الوضع الخفي");
                }}
                className={cn(
                  "w-12 h-6 rounded-full transition-colors relative",
                  profile.ghostMode ? "bg-primary" : "bg-muted"
                )}
              >
                <div
                  className={cn(
                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                    profile.ghostMode ? "right-1" : "right-7"
                  )}
                />
              </button>
            </div>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="p-4 card-shadow border-destructive/20">
          <h3 className="font-bold text-destructive flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5" />
            منطقة الخطر
          </h3>

          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            className="w-full rounded-xl"
          >
            <Trash2 className="w-4 h-4 ml-2" />
            حذف الحساب
          </Button>
        </Card>
          </>
        )}
      </div>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">تغيير كلمة المرور</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">كلمة المرور الحالية</label>
              <div className="relative">
                <Input
                  type={showPasswords.current ? "text" : "password"}
                  value={passwords.current}
                  onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  className="bg-secondary border-0 rounded-xl pl-10"
                />
                <button
                  onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">كلمة المرور الجديدة</label>
              <div className="relative">
                <Input
                  type={showPasswords.new ? "text" : "password"}
                  value={passwords.new}
                  onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                  className="bg-secondary border-0 rounded-xl pl-10"
                />
                <button
                  onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">تأكيد كلمة المرور</label>
              <div className="relative">
                <Input
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  className="bg-secondary border-0 rounded-xl pl-10"
                />
                <button
                  onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowPasswordDialog(false)}
                className="flex-1 rounded-xl"
              >
                إلغاء
              </Button>
              <Button
                onClick={handleChangePassword}
                className="flex-1 rounded-xl bg-primary"
              >
                تغيير
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-destructive">حذف الحساب</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-destructive" />
              </div>
            </div>
            <p className="text-center text-muted-foreground">
              هل أنت متأكد من حذف حسابك؟ سيتم فقدان جميع البيانات نهائياً.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                className="flex-1 rounded-xl"
              >
                إلغاء
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                className="flex-1 rounded-xl"
              >
                حذف
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
