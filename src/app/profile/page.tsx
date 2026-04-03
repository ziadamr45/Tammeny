"use client";

import { useState, useRef } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
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

  const handleEdit = () => {
    setEditedProfile(profile);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedProfile(profile);
  };

  const handleSaveEdit = () => {
    setProfile(editedProfile);
    setIsEditing(false);
    toast.success("تم حفظ التغييرات بنجاح!");
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const newAvatar = reader.result as string;
        if (isEditing) {
          setEditedProfile({ ...editedProfile, avatar: newAvatar });
        } else {
          setProfile({ ...profile, avatar: newAvatar });
        }
        toast.success("تم تحديث الصورة الشخصية!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChangePassword = () => {
    if (passwords.new !== passwords.confirm) {
      toast.error("كلمة المرور الجديدة غير متطابقة!");
      return;
    }
    if (passwords.new.length < 8) {
      toast.error("كلمة المرور يجب أن تكون 8 أحرف على الأقل!");
      return;
    }
    setShowPasswordDialog(false);
    setPasswords({ current: "", new: "", confirm: "" });
    toast.success("تم تغيير كلمة المرور بنجاح!");
  };

  const handleDeleteAccount = () => {
    setShowDeleteDialog(false);
    toast.error("تم حذف الحساب!", { duration: 5000 });
    router.push("/");
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
              className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
            >
              <Camera className="w-4 h-4" />
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
                  setProfile({ ...profile, notifications: !profile.notifications });
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
                  setProfile({ ...profile, ghostMode: !profile.ghostMode });
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
