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
import { useLanguage } from "@/contexts/language-context";

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

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { language, t, direction } = useLanguage();
  const [localProfileOverrides, setLocalProfileOverrides] = useState<Partial<UserProfile>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile>({
    name: "",
    email: "",
    phone: "",
    avatar: null,
    address: "",
    gender: "male",
    notifications: true,
    ghostMode: false,
  });
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
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Compute profile from user data with local overrides
  const profile = useMemo<UserProfile>(() => {
    return user ? {
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      avatar: user.avatar,
      address: "",
      gender: (user.gender as "male" | "female") || "male",
      notifications: true,
      ghostMode: false,
      ...localProfileOverrides,
    } : editedProfile;
  }, [user, localProfileOverrides, editedProfile]);

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editedProfile.name,
          email: editedProfile.email,
          phone: editedProfile.phone,
          avatar: editedProfile.avatar,
          gender: editedProfile.gender,
          address: editedProfile.address,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setLocalProfileOverrides(editedProfile);
        setIsEditing(false);
        toast.success(language === 'ar' ? "تم حفظ التغييرات بنجاح!" : "Changes saved successfully!");
      } else {
        toast.error(data.error || (language === 'ar' ? "فشل في حفظ التغييرات" : "Failed to save changes"));
      }
    } catch {
      toast.error(language === 'ar' ? "حدث خطأ أثناء الحفظ" : "Error saving changes");
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(language === 'ar' ? "يرجى اختيار ملف صورة صالح" : "Please select a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(language === 'ar' ? "حجم الصورة يجب أن يكون أقل من 5 ميجابايت" : "Image must be less than 5MB");
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const compressedBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
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
              let quality = 0.8;
              let compressed = canvas.toDataURL('image/jpeg', quality);
              
              while (compressed.length > 200000 && quality > 0.1) {
                quality -= 0.1;
                compressed = canvas.toDataURL('image/jpeg', quality);
              }
              resolve(compressed);
            } else {
              reject(new Error(language === 'ar' ? 'فشل في معالجة الصورة' : 'Failed to process image'));
            }
          };
          img.onerror = () => reject(new Error(language === 'ar' ? 'فشل في تحميل الصورة' : 'Failed to load image'));
          img.src = reader.result as string;
        };
        reader.onerror = () => reject(new Error(language === 'ar' ? 'فشل في قراءة الملف' : 'Failed to read file'));
        reader.readAsDataURL(file);
      });

      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: compressedBase64 }),
      });

      const data = await response.json();

      if (data.success) {
        if (isEditing) {
          setEditedProfile({ ...editedProfile, avatar: compressedBase64 });
        } else {
          setLocalProfileOverrides({ ...localProfileOverrides, avatar: compressedBase64 });
        }
        toast.success(language === 'ar' ? "تم تحديث الصورة الشخصية بنجاح!" : "Profile picture updated!");
      } else {
        toast.error(data.error || (language === 'ar' ? "فشل في تحديث الصورة" : "Failed to update picture"));
      }
    } catch {
      toast.error(language === 'ar' ? "حدث خطأ أثناء معالجة الصورة" : "Error processing image");
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleChangePassword = async () => {
    if (!passwords.current) {
      toast.error(language === 'ar' ? "يرجى إدخال كلمة المرور الحالية" : "Please enter current password");
      return;
    }
    if (passwords.new !== passwords.confirm) {
      toast.error(language === 'ar' ? "كلمة المرور الجديدة غير متطابقة!" : "Passwords do not match!");
      return;
    }
    if (passwords.new.length < 8) {
      toast.error(language === 'ar' ? "كلمة المرور يجب أن تكون 8 أحرف على الأقل!" : "Password must be at least 8 characters!");
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
        toast.success(language === 'ar' ? "تم تغيير كلمة المرور بنجاح!" : "Password changed successfully!");
      } else {
        toast.error(data.error || (language === 'ar' ? "فشل في تغيير كلمة المرور" : "Failed to change password"));
      }
    } catch {
      toast.error(language === 'ar' ? "حدث خطأ أثناء تغيير كلمة المرور" : "Error changing password");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const response = await fetch('/api/user', { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        setShowDeleteDialog(false);
        await fetch('/api/auth/logout', { method: 'POST' });
        toast.success(language === 'ar' ? "تم حذف الحساب بنجاح" : "Account deleted successfully");
        router.push('/login');
      } else {
        toast.error(data.error || (language === 'ar' ? "فشل في حذف الحساب" : "Failed to delete account"));
      }
    } catch {
      toast.error(language === 'ar' ? "حدث خطأ أثناء حذف الحساب" : "Error deleting account");
    }
  };

  // Auth Loading State
  if (authLoading) {
    return (
      <main className="min-h-screen bg-background pb-24">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">{t.common.loading}</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <main className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-card/95 backdrop-blur-lg border-b border-border z-50">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowRight className={cn("w-5 h-5", direction === 'ltr' && "rotate-180")} />
          </button>
          <h1 className="font-bold text-lg">{t.profile.title}</h1>
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
        {/* Avatar Section */}
        <Card className="p-6 card-shadow text-center">
          <div className="relative inline-block">
            <Avatar className="w-28 h-28 border-4 border-primary/20 mx-auto cursor-pointer group" onClick={handleAvatarClick}>
              <AvatarImage src={profile.avatar || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-teal-dark text-primary-foreground text-4xl font-bold">
                {profile.name?.[0] || (language === 'ar' ? 'أ' : 'U')}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={handleAvatarClick}
              disabled={isUploadingAvatar}
              className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isUploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>
          
          <h2 className="text-xl font-bold mt-4">{profile.name}</h2>
          <p className="text-muted-foreground text-sm">{profile.email}</p>
          
          <div className="flex items-center justify-center gap-2 mt-3">
            <Badge variant="secondary" className="bg-primary/10 text-primary gap-1">
              <Shield className="w-3 h-3" />
              {language === 'ar' ? "موثق" : "Verified"}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              {profile.gender === "male" ? t.profile.male : t.profile.female}
            </Badge>
          </div>
        </Card>

        {/* Profile Form */}
        <Card className="p-4 card-shadow space-y-4">
          <h3 className="font-bold flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            {language === 'ar' ? "معلومات شخصية" : "Personal Information"}
          </h3>

          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">{t.profile.name}</label>
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
              <label className="text-sm text-muted-foreground">{t.profile.email}</label>
              {isEditing ? (
                <Input
                  type="email"
                  value={editedProfile.email}
                  onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                  className="bg-secondary border-0 rounded-xl"
                  dir="ltr"
                />
              ) : (
                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium" dir="ltr">{profile.email}</span>
                </div>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">{t.profile.phone}</label>
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
              <label className="text-sm text-muted-foreground">{t.profile.address}</label>
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
                <label className="text-sm text-muted-foreground">{t.profile.gender}</label>
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
                    {t.profile.male}
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
                    {t.profile.female}
                  </button>
                </div>
              </div>
            )}
          </div>

          {isEditing && (
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={handleCancelEdit} className="flex-1 rounded-xl">
                <X className={cn("w-4 h-4", direction === 'rtl' ? 'ml-2' : 'mr-2')} />
                {t.profile.cancel}
              </Button>
              <Button onClick={handleSaveEdit} className="flex-1 rounded-xl bg-primary">
                <Save className={cn("w-4 h-4", direction === 'rtl' ? 'ml-2' : 'mr-2')} />
                {t.profile.save}
              </Button>
            </div>
          )}
        </Card>

        {/* Settings */}
        <Card className="p-4 card-shadow space-y-4">
          <h3 className="font-bold flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            {language === 'ar' ? "إعدادات الأمان" : "Security Settings"}
          </h3>

          <div className="space-y-3">
            {/* Change Password */}
            <button
              onClick={() => setShowPasswordDialog(true)}
              className="w-full flex items-center gap-3 p-3 bg-secondary/50 rounded-xl hover:bg-secondary transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Shield className="w-5 h-5 text-orange-600" />
              </div>
              <div className={cn("flex-1", direction === 'rtl' ? 'text-right' : 'text-left')}>
                <div className="font-medium">{t.settings.changePassword}</div>
                <div className="text-xs text-muted-foreground">
                  {language === 'ar' ? "تحديث كلمة المرور للحماية" : "Update password for security"}
                </div>
              </div>
              <ArrowRight className={cn("w-5 h-5 text-muted-foreground", direction === 'ltr' && "rotate-180")} />
            </button>

            {/* Notifications */}
            <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium">{t.settings.notifications}</div>
                <div className="text-xs text-muted-foreground">{t.settings.notificationsDesc}</div>
              </div>
              <button
                onClick={() => {
                  setLocalProfileOverrides({ ...localProfileOverrides, notifications: !profile.notifications });
                  toast.success(profile.notifications 
                    ? (language === 'ar' ? "تم إيقاف الإشعارات" : "Notifications disabled")
                    : (language === 'ar' ? "تم تفعيل الإشعارات" : "Notifications enabled"));
                }}
                className={cn(
                  "w-12 h-6 rounded-full transition-colors relative",
                  profile.notifications ? "bg-primary" : "bg-muted"
                )}
              >
                <div
                  className={cn(
                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                    profile.notifications ? (direction === 'rtl' ? 'right-1' : 'right-1') : (direction === 'rtl' ? 'left-1' : 'left-1')
                  )}
                />
              </button>
            </div>

            {/* Ghost Mode */}
            <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Eye className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium">{language === 'ar' ? "الوضع الخفي" : "Ghost Mode"}</div>
                <div className="text-xs text-muted-foreground">
                  {language === 'ar' ? "مشاركة موقع تقريبي" : "Share approximate location"}
                </div>
              </div>
              <button
                onClick={() => {
                  setLocalProfileOverrides({ ...localProfileOverrides, ghostMode: !profile.ghostMode });
                  toast.success(profile.ghostMode 
                    ? (language === 'ar' ? "تم إيقاف الوضع الخفي" : "Ghost mode disabled")
                    : (language === 'ar' ? "تم تفعيل الوضع الخفي" : "Ghost mode enabled"));
                }}
                className={cn(
                  "w-12 h-6 rounded-full transition-colors relative",
                  profile.ghostMode ? "bg-primary" : "bg-muted"
                )}
              >
                <div
                  className={cn(
                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                    profile.ghostMode ? (direction === 'rtl' ? 'right-1' : 'right-1') : (direction === 'rtl' ? 'left-1' : 'left-1')
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
            {language === 'ar' ? "منطقة الخطر" : "Danger Zone"}
          </h3>

          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} className="w-full rounded-xl">
            <Trash2 className={cn("w-4 h-4", direction === 'rtl' ? 'ml-2' : 'mr-2')} />
            {language === 'ar' ? "حذف الحساب" : "Delete Account"}
          </Button>
        </Card>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">{t.settings.changePassword}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                {language === 'ar' ? "كلمة المرور الحالية" : "Current Password"}
              </label>
              <div className="relative">
                <Input
                  type={showPasswords.current ? "text" : "password"}
                  value={passwords.current}
                  onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  className={cn("bg-secondary border-0 rounded-xl", direction === 'rtl' ? 'pl-10' : 'pr-10')}
                />
                <button
                  onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                  className={cn("absolute top-1/2 -translate-y-1/2 text-muted-foreground", direction === 'rtl' ? 'left-3' : 'right-3')}
                >
                  {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                {language === 'ar' ? "كلمة المرور الجديدة" : "New Password"}
              </label>
              <div className="relative">
                <Input
                  type={showPasswords.new ? "text" : "password"}
                  value={passwords.new}
                  onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                  className={cn("bg-secondary border-0 rounded-xl", direction === 'rtl' ? 'pl-10' : 'pr-10')}
                />
                <button
                  onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  className={cn("absolute top-1/2 -translate-y-1/2 text-muted-foreground", direction === 'rtl' ? 'left-3' : 'right-3')}
                >
                  {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                {language === 'ar' ? "تأكيد كلمة المرور" : "Confirm Password"}
              </label>
              <div className="relative">
                <Input
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  className={cn("bg-secondary border-0 rounded-xl", direction === 'rtl' ? 'pl-10' : 'pr-10')}
                />
                <button
                  onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  className={cn("absolute top-1/2 -translate-y-1/2 text-muted-foreground", direction === 'rtl' ? 'left-3' : 'right-3')}
                >
                  {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowPasswordDialog(false)} className="flex-1 rounded-xl">
                {t.profile.cancel}
              </Button>
              <Button onClick={handleChangePassword} className="flex-1 rounded-xl bg-primary">
                {language === 'ar' ? "تغيير" : "Change"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-destructive">
              {language === 'ar' ? "حذف الحساب" : "Delete Account"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-destructive" />
              </div>
            </div>
            <p className="text-center text-muted-foreground">
              {language === 'ar' 
                ? "هل أنت متأكد من حذف حسابك؟ سيتم فقدان جميع البيانات نهائياً."
                : "Are you sure you want to delete your account? All data will be permanently lost."}
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="flex-1 rounded-xl">
                {t.profile.cancel}
              </Button>
              <Button variant="destructive" onClick={handleDeleteAccount} className="flex-1 rounded-xl">
                {language === 'ar' ? "حذف" : "Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
