"use client";

import { useState, useEffect, useCallback } from "react";
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
  Users,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relation: string | null;
  priority: number;
  createdAt: string;
}

export default function EmergencyContactsPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedContact, setSelectedContact] = useState<EmergencyContact | null>(null);
  const [newContact, setNewContact] = useState({
    name: "",
    phone: "",
    relation: "صديق",
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch emergency contacts from API
  const fetchContacts = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const response = await fetch("/api/emergency-contacts");
      const data = await response.json();

      if (data.success) {
        setContacts(data.emergencyContacts);
        setError(null);
      } else {
        setError(data.error || "فشل في تحميل جهات الاتصال");
      }
    } catch (err) {
      console.error("Error fetching emergency contacts:", err);
      setError("فشل في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch contacts when user is available
  useEffect(() => {
    if (user?.id) {
      fetchContacts();
    }
  }, [user?.id, fetchContacts]);

  const handleAddContact = async () => {
    if (!newContact.name || !newContact.phone) {
      toast.error("يرجى ملء جميع الحقول");
      return;
    }

    try {
      const response = await fetch("/api/emergency-contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newContact,
          priority: contacts.length + 1,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setContacts([...contacts, data.emergencyContact]);
        setShowAddDialog(false);
        setNewContact({ name: "", phone: "", relation: "صديق" });
        toast.success("تمت إضافة جهة الاتصال");
      } else {
        toast.error(data.error || "فشل في إضافة جهة الاتصال");
      }
    } catch (err) {
      console.error("Error adding contact:", err);
      toast.error("فشل في إضافة جهة الاتصال");
    }
  };

  const handleEditContact = async () => {
    if (!selectedContact) return;

    try {
      const response = await fetch(`/api/emergency-contacts/${selectedContact.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: selectedContact.name,
          phone: selectedContact.phone,
          relation: selectedContact.relation,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setContacts(contacts.map((c) => (c.id === selectedContact.id ? data.emergencyContact : c)));
        setShowEditDialog(false);
        setSelectedContact(null);
        toast.success("تم تحديث جهة الاتصال");
      } else {
        toast.error(data.error || "فشل في تحديث جهة الاتصال");
      }
    } catch (err) {
      console.error("Error editing contact:", err);
      toast.error("فشل في تحديث جهة الاتصال");
    }
  };

  const handleDeleteContact = async () => {
    if (!selectedContact) return;

    try {
      const response = await fetch(`/api/emergency-contacts/${selectedContact.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setContacts(contacts.filter((c) => c.id !== selectedContact.id));
        setShowDeleteDialog(false);
        setSelectedContact(null);
        toast.success("تم حذف جهة الاتصال");
      } else {
        toast.error(data.error || "فشل في حذف جهة الاتصال");
      }
    } catch (err) {
      console.error("Error deleting contact:", err);
      toast.error("فشل في حذف جهة الاتصال");
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
        {/* Auth Loading State */}
        {authLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">جاري التحميل...</p>
          </div>
        )}

        {/* SOS Info Card */}
        {!authLoading && isAuthenticated && (
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
        )}

        {/* Loading State */}
        {!authLoading && isAuthenticated && loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">جاري التحميل...</p>
          </div>
        )}

        {/* Error State */}
        {!authLoading && isAuthenticated && error && !loading && (
          <Card className="p-6 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={fetchContacts} variant="outline">
              إعادة المحاولة
            </Button>
          </Card>
        )}

        {/* Stats */}
        {!authLoading && isAuthenticated && !loading && !error && (
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-4 card-shadow text-center">
              <div className="text-2xl font-bold text-primary">{contacts.length}</div>
              <div className="text-xs text-muted-foreground">جهة اتصال</div>
            </Card>
            <Card className="p-4 card-shadow text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {contacts.filter((c) => c.priority === 1).length}
              </div>
              <div className="text-xs text-muted-foreground">أولوية عالية</div>
            </Card>
            <Card className="p-4 card-shadow text-center">
              <div className="text-2xl font-bold text-green-600">
                {contacts.filter((c) => c.priority <= 3).length}
              </div>
              <div className="text-xs text-muted-foreground">مفعّل للطوارئ</div>
            </Card>
          </div>
        )}

        {/* Contacts List */}
        {!authLoading && isAuthenticated && !loading && !error && contacts.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-muted-foreground" />
              جهات الطوارئ ({contacts.length})
            </h3>
            <div className="space-y-2">
              {contacts.map((contact) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
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
        {!authLoading && isAuthenticated && !loading && !error && contacts.length === 0 && (
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
        {!authLoading && isAuthenticated && !loading && !error && (
          <Card className="p-4 card-shadow">
            <h3 className="font-bold mb-4">إجراءات سريعة</h3>
            <div className="space-y-3">
              <button
                onClick={async () => {
                  try {
                    // Send test alert to all emergency contacts
                    const response = await fetch('/api/emergency-contacts/test-alert', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                    });
                    const data = await response.json();
                    
                    if (data.success) {
                      toast.success(`تم إرسال تنبيه تجريبي إلى ${data.sentCount || contacts.length} جهة اتصال`);
                    } else {
                      toast.error(data.error || 'فشل إرسال التنبيه التجريبي');
                    }
                  } catch (error) {
                    console.error('Error sending test alert:', error);
                    toast.error('فشل إرسال التنبيه التجريبي');
                  }
                }}
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
                onClick={async () => {
                  // Check if Contact Picker API is available
                  if ('contacts' in navigator && 'select' in (navigator as Navigator & { contacts: { select: (props: string[], options: { multiple: boolean }) => Promise<unknown[]> } }).contacts) {
                    try {
                      const contacts = await (navigator as Navigator & { 
                        contacts: { 
                          select: (props: string[], options: { multiple: boolean }) => Promise<Array<{ name: string; tel: string[] }>> 
                        } 
                      }).contacts.select(['name', 'tel'], { multiple: true });
                      
                      if (contacts.length > 0) {
                        // Add imported contacts
                        for (const contact of contacts.slice(0, 5)) {
                          if (contact.name && contact.tel && contact.tel[0]) {
                            await fetch("/api/emergency-contacts", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                name: contact.name,
                                phone: contact.tel[0],
                                relation: "صديق",
                                priority: contacts.length + 1,
                              }),
                            });
                          }
                        }
                        toast.success(`تم استيراد ${contacts.length} جهة اتصال`);
                        fetchContacts();
                      }
                    } catch (err) {
                      console.error("Error importing contacts:", err);
                      toast.error("فشل استيراد جهات الاتصال");
                    }
                  } else {
                    // Fallback: Show instructions
                    toast.info("متصفحك لا يدعم استيراد جهات الاتصال. يمكنك الإضافة يدوياً أو استخدام التطبيق على جهاز محمول.", {
                      duration: 5000,
                    });
                  }
                }}
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
        )}
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
  onEdit,
  onDelete,
}: {
  contact: EmergencyContact;
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
            {contact.relation && (
              <Badge variant="secondary" className="text-xs">
                {contact.relation}
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground mt-0.5" dir="ltr">
            {contact.phone}
          </div>

          {/* Priority badge */}
          <div className="flex items-center gap-4 mt-3">
            <div className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs transition-all",
              contact.priority === 1
                ? "bg-red-100 text-red-700"
                : contact.priority <= 3
                ? "bg-yellow-100 text-yellow-700"
                : "bg-muted text-muted-foreground"
            )}>
              <Shield className="w-3 h-3" />
              أولوية {contact.priority}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1">
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
