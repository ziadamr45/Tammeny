"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowRight,
  AlertTriangle,
  Phone,
  UserPlus,
  Star,
  Trash2,
  Edit3,
  Shield,
  CheckCircle,
  Bell,
  MessageCircle,
  MapPin,
  Clock,
  Heart,
  Users,
  PhoneCall,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  avatar: string | null;
  isFavorite: boolean;
  relation: string;
  notifyOnEmergency: boolean;
  notifyOnArrival: boolean;
}

const INITIAL_CONTACTS: EmergencyContact[] = [
  {
    id: "1",
    name: "أحمد محمد",
    phone: "+20 123 456 7890",
    avatar: null,
    isFavorite: true,
    relation: "أخ",
    notifyOnEmergency: true,
    notifyOnArrival: true,
  },
  {
    id: "2",
    name: "سارة أحمد",
    phone: "+20 987 654 3210",
    avatar: null,
    isFavorite: true,
    relation: "زوجة",
    notifyOnEmergency: true,
    notifyOnArrival: true,
  },
  {
    id: "3",
    name: "محمد علي",
    phone: "+20 555 123 4567",
    avatar: null,
    isFavorite: false,
    relation: "صديق",
    notifyOnEmergency: true,
    notifyOnArrival: false,
  },
];

export default function EmergencyContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<EmergencyContact[]>(INITIAL_CONTACTS);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedContact, setSelectedContact] = useState<EmergencyContact | null>(null);
  const [newContact, setNewContact] = useState({
    name: "",
    phone: "",
    relation: "صديق",
  });

  const handleAddContact = () => {
    if (!newContact.name || !newContact.phone) {
      toast.error("يرجى ملء جميع الحقول");
      return;
    }
    const contact: EmergencyContact = {
      id: Date.now().toString(),
      ...newContact,
      avatar: null,
      isFavorite: false,
      notifyOnEmergency: true,
      notifyOnArrival: false,
    };
    setContacts([...contacts, contact]);
    setShowAddDialog(false);
    setNewContact({ name: "", phone: "", relation: "صديق" });
    toast.success("تمت إضافة جهة الاتصال");
  };

  const handleEditContact = () => {
    if (!selectedContact) return;
    setContacts(contacts.map((c) => (c.id === selectedContact.id ? selectedContact : c)));
    setShowEditDialog(false);
    setSelectedContact(null);
    toast.success("تم تحديث جهة الاتصال");
  };

  const handleDeleteContact = () => {
    if (!selectedContact) return;
    setContacts(contacts.filter((c) => c.id !== selectedContact.id));
    setShowDeleteDialog(false);
    setSelectedContact(null);
    toast.success("تم حذف جهة الاتصال");
  };

  const handleToggleFavorite = (id: string) => {
    setContacts(
      contacts.map((c) => (c.id === id ? { ...c, isFavorite: !c.isFavorite } : c))
    );
  };

  const handleToggleNotify = (id: string, type: "emergency" | "arrival") => {
    setContacts(
      contacts.map((c) =>
        c.id === id
          ? {
              ...c,
              [type === "emergency" ? "notifyOnEmergency" : "notifyOnArrival"]: !(
                type === "emergency" ? c.notifyOnEmergency : c.notifyOnArrival
              ),
            }
          : c
      )
    );
  };

  const favorites = contacts.filter((c) => c.isFavorite);
  const others = contacts.filter((c) => !c.isFavorite);

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
          <h1 className="font-bold text-lg">جهات الطوارئ</h1>
          <button
            onClick={() => setShowAddDialog(true)}
            className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <UserPlus className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* SOS Info Card */}
        <Card className="p-4 card-shadow bg-gradient-to-l from-red-500 to-red-600 text-white border-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-lg">تنبيه الطوارئ SOS</div>
              <div className="text-white/80 text-sm">
                سيتم إرسال موقعك لهؤلاء الأشخاص عند الضغط على زر الطوارئ
              </div>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 card-shadow text-center">
            <div className="text-2xl font-bold text-primary">{contacts.length}</div>
            <div className="text-xs text-muted-foreground">جهة اتصال</div>
          </Card>
          <Card className="p-4 card-shadow text-center">
            <div className="text-2xl font-bold text-yellow-600">{favorites.length}</div>
            <div className="text-xs text-muted-foreground">مفضل</div>
          </Card>
          <Card className="p-4 card-shadow text-center">
            <div className="text-2xl font-bold text-green-600">
              {contacts.filter((c) => c.notifyOnEmergency).length}
            </div>
            <div className="text-xs text-muted-foreground">مفعّل للطوارئ</div>
          </Card>
        </div>

        {/* Favorites */}
        {favorites.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-bold flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              المفضلون
            </h3>
            <div className="space-y-2">
              {favorites.map((contact) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  onToggleFavorite={() => handleToggleFavorite(contact.id)}
                  onToggleNotify={handleToggleNotify}
                  onEdit={() => {
                    setSelectedContact(contact);
                    setShowEditDialog(true);
                  }}
                  onDelete={() => {
                    setSelectedContact(contact);
                    setShowDeleteDialog(true);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Other Contacts */}
        {others.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-muted-foreground" />
              جهات اتصال أخرى
            </h3>
            <div className="space-y-2">
              {others.map((contact) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  onToggleFavorite={() => handleToggleFavorite(contact.id)}
                  onToggleNotify={handleToggleNotify}
                  onEdit={() => {
                    setSelectedContact(contact);
                    setShowEditDialog(true);
                  }}
                  onDelete={() => {
                    setSelectedContact(contact);
                    setShowDeleteDialog(true);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {contacts.length === 0 && (
          <Card className="p-8 text-center card-shadow">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-bold text-lg mb-2">لا توجد جهات اتصال</h3>
            <p className="text-muted-foreground text-sm mb-4">
              أضف جهات اتصال للطوارئ ليتم إبلاغهم عند الحاجة
            </p>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="rounded-xl bg-primary"
            >
              <UserPlus className="w-4 h-4 ml-2" />
              إضافة جهة اتصال
            </Button>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="p-4 card-shadow">
          <h3 className="font-bold mb-4">إجراءات سريعة</h3>
          <div className="space-y-3">
            <button
              onClick={() => toast.info("سيتم إرسال تنبيه تجريبي")}
              className="w-full flex items-center gap-3 p-3 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <Bell className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1 text-right">
                <div className="font-medium text-red-700">إرسال تنبيه تجريبي</div>
                <div className="text-xs text-red-600">اختر نظام الإشعارات</div>
              </div>
              <ArrowRight className="w-5 h-5 text-red-400" />
            </button>

            <button
              onClick={() => toast.success("تم استيراد جهات الاتصال")}
              className="w-full flex items-center gap-3 p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 text-right">
                <div className="font-medium text-blue-700">استيراد من جهات الاتصال</div>
                <div className="text-xs text-blue-600">إضافة من دفتر العناوين</div>
              </div>
              <ArrowRight className="w-5 h-5 text-blue-400" />
            </button>
          </div>
        </Card>
      </div>

      {/* Add Contact Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">إضافة جهة اتصال طوارئ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">الاسم</label>
              <Input
                value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                placeholder="اسم جهة الاتصال"
                className="bg-secondary border-0 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">رقم الهاتف</label>
              <Input
                type="tel"
                value={newContact.phone}
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                placeholder="+20 xxx xxx xxxx"
                className="bg-secondary border-0 rounded-xl"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">صلة القرابة</label>
              <div className="flex flex-wrap gap-2">
                {["أب", "أم", "أخ", "أخت", "زوج", "زوجة", "صديق", "زميل"].map((rel) => (
                  <button
                    key={rel}
                    onClick={() => setNewContact({ ...newContact, relation: rel })}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm border-2 transition-all",
                      newContact.relation === rel
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    {rel}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                className="flex-1 rounded-xl"
              >
                إلغاء
              </Button>
              <Button
                onClick={handleAddContact}
                className="flex-1 rounded-xl bg-primary"
              >
                إضافة
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Contact Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">تعديل جهة الاتصال</DialogTitle>
          </DialogHeader>
          {selectedContact && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">الاسم</label>
                <Input
                  value={selectedContact.name}
                  onChange={(e) =>
                    setSelectedContact({ ...selectedContact, name: e.target.value })
                  }
                  className="bg-secondary border-0 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">رقم الهاتف</label>
                <Input
                  type="tel"
                  value={selectedContact.phone}
                  onChange={(e) =>
                    setSelectedContact({ ...selectedContact, phone: e.target.value })
                  }
                  className="bg-secondary border-0 rounded-xl"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">صلة القرابة</label>
                <div className="flex flex-wrap gap-2">
                  {["أب", "أم", "أخ", "أخت", "زوج", "زوجة", "صديق", "زميل"].map((rel) => (
                    <button
                      key={rel}
                      onClick={() =>
                        setSelectedContact({ ...selectedContact, relation: rel })
                      }
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm border-2 transition-all",
                        selectedContact.relation === rel
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      {rel}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                  className="flex-1 rounded-xl"
                >
                  إلغاء
                </Button>
                <Button
                  onClick={handleEditContact}
                  className="flex-1 rounded-xl bg-primary"
                >
                  حفظ
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-destructive">حذف جهة الاتصال</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-center text-muted-foreground">
              هل أنت متأكد من حذف "{selectedContact?.name}" من جهات الطوارئ؟
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
                onClick={handleDeleteContact}
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

function ContactCard({
  contact,
  onToggleFavorite,
  onToggleNotify,
  onEdit,
  onDelete,
}: {
  contact: EmergencyContact;
  onToggleFavorite: () => void;
  onToggleNotify: (id: string, type: "emergency" | "arrival") => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="p-4 card-shadow">
      <div className="flex items-start gap-3">
        <Avatar className="w-12 h-12 border-2 border-primary/20">
          <AvatarFallback className="bg-gradient-to-br from-primary to-teal-dark text-primary-foreground font-bold">
            {contact.name[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold">{contact.name}</span>
            <Badge variant="secondary" className="text-xs">
              {contact.relation}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground mt-0.5" dir="ltr">
            {contact.phone}
          </div>

          {/* Notification toggles */}
          <div className="flex items-center gap-4 mt-3">
            <button
              onClick={() => onToggleNotify(contact.id, "emergency")}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs transition-all",
                contact.notifyOnEmergency
                  ? "bg-red-100 text-red-700"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <AlertTriangle className="w-3 h-3" />
              طوارئ
            </button>
            <button
              onClick={() => onToggleNotify(contact.id, "arrival")}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs transition-all",
                contact.notifyOnArrival
                  ? "bg-green-100 text-green-700"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <CheckCircle className="w-3 h-3" />
              وصول
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1">
          <button
            onClick={onToggleFavorite}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <Star
              className={cn(
                "w-5 h-5 transition-colors",
                contact.isFavorite
                  ? "text-yellow-500 fill-yellow-500"
                  : "text-muted-foreground"
              )}
            />
          </button>
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <Edit3 className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
          </button>
        </div>
      </div>
    </Card>
  );
}
