"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  UserPlus,
  Search,
  Star,
  Phone,
  Mail,
  MapPin,
  MoreVertical,
  StarOff,
  Trash2,
  Loader2,
} from "lucide-react";
import { BottomNav, Header } from "@/components/tamenny/bottom-nav";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

interface Contact {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  relation: string | null;
  isFavorite: boolean;
  isEmergencyContact: boolean;
  notifyOnArrival: boolean;
  notifyOnEmergency: boolean;
  createdAt: string;
}

export default function ContactsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newContact, setNewContact] = useState({
    name: "",
    phone: "",
    email: "",
    relation: "",
  });
  const router = useRouter();

  // Fetch contacts from API
  const fetchContacts = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/contacts?userId=${user.id}`);
      const data = await response.json();

      if (data.success) {
        setContacts(data.contacts);
        setError(null);
      } else {
        setError(data.error || "فشل في تحميل جهات الاتصال");
      }
    } catch (err) {
      console.error("Error fetching contacts:", err);
      setError("فشل في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch contacts when user is available
  useEffect(() => {
    if (user?.id) {
      fetchContacts();
    }
  }, [user?.id, fetchContacts]);

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.includes(searchQuery) ||
      (contact.phone && contact.phone.includes(searchQuery)) ||
      (contact.email && contact.email.includes(searchQuery))
  );

  const favoriteContacts = filteredContacts.filter((c) => c.isFavorite);
  const otherContacts = filteredContacts.filter((c) => !c.isFavorite);

  const handleAddContact = async () => {
    if (!newContact.name) {
      toast.error("الاسم مطلوب");
      return;
    }

    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...newContact, userId: user?.id }),
      });

      const data = await response.json();

      if (data.success) {
        setContacts([...contacts, data.contact]);
        setNewContact({ name: "", phone: "", email: "", relation: "" });
        setShowAddModal(false);
        toast.success("تمت إضافة جهة الاتصال");
      } else {
        toast.error(data.error || "فشل في إضافة جهة الاتصال");
      }
    } catch (err) {
      console.error("Error adding contact:", err);
      toast.error("فشل في إضافة جهة الاتصال");
    }
  };

  const handleToggleFavorite = async (id: string) => {
    const contact = contacts.find((c) => c.id === id);
    if (!contact) return;

    try {
      const response = await fetch(`/api/contacts/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isFavorite: !contact.isFavorite,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setContacts(
          contacts.map((c) =>
            c.id === id ? { ...c, isFavorite: !c.isFavorite } : c
          )
        );
        toast.success("تم تحديث المفضلة");
      } else {
        toast.error(data.error || "فشل في تحديث المفضلة");
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
      toast.error("فشل في تحديث المفضلة");
    }
  };

  const handleDeleteContact = async (id: string) => {
    try {
      const response = await fetch(`/api/contacts/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setContacts(contacts.filter((c) => c.id !== id));
        toast.success("تم حذف جهة الاتصال");
      } else {
        toast.error(data.error || "فشل في حذف جهة الاتصال");
      }
    } catch (err) {
      console.error("Error deleting contact:", err);
      toast.error("فشل في حذف جهة الاتصال");
    }
  };

  const handleShareLocation = (contact: Contact) => {
    toast.success(`جاري مشاركة الموقع مع ${contact.name}...`);
  };

  return (
    <main className="min-h-screen bg-background pb-20">
      <Header />

      <div className="pt-16 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">جهات الاتصال</h1>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-primary rounded-xl"
          >
            <UserPlus className="w-4 h-4 ml-2" />
            إضافة
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="بحث في جهات الاتصال..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 rounded-xl bg-secondary border-0 px-4 py-3 text-right focus:ring-2 focus:ring-primary outline-none"
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">جاري التحميل...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <Card className="p-6 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={fetchContacts} variant="outline">
              إعادة المحاولة
            </Button>
          </Card>
        )}

        {/* Contacts List */}
        {!loading && !error && (
          <>
            {/* Favorites */}
            {favoriteContacts.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  المفضلة
                </h2>
                <div className="space-y-2">
                  {favoriteContacts.map((contact) => (
                    <ContactCard
                      key={contact.id}
                      contact={contact}
                      onShare={() => handleShareLocation(contact)}
                      onToggleFavorite={() => handleToggleFavorite(contact.id)}
                      onDelete={() => handleDeleteContact(contact.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All Contacts */}
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-3">
                جميع جهات الاتصال ({otherContacts.length})
              </h2>
              <div className="space-y-2">
                {otherContacts.map((contact) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    onShare={() => handleShareLocation(contact)}
                    onToggleFavorite={() => handleToggleFavorite(contact.id)}
                    onDelete={() => handleDeleteContact(contact.id)}
                  />
                ))}
              </div>
            </div>

            {/* Empty State */}
            {filteredContacts.length === 0 && (
              <div className="text-center py-12">
                <UserPlus className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium text-lg mb-2">لا توجد جهات اتصال</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  أضف جهات اتصال لمشاركة موقعك بسهولة
                </p>
                <Button onClick={() => setShowAddModal(true)} variant="outline">
                  <UserPlus className="w-4 h-4 ml-2" />
                  إضافة جهة اتصال
                </Button>
              </div>
            )}

            {/* Quick Share Info */}
            <Card className="mt-6 p-4 bg-primary/10 border-0">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-medium text-primary">مشاركة سريعة</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    اضغط على زر المشاركة بجوار أي جهة اتصال لمشاركة موقعك معها مباشرة
                  </p>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      <BottomNav />

      {/* Add Contact Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">إضافة جهة اتصال</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">الاسم *</label>
              <Input
                placeholder="اسم جهة الاتصال"
                value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                className="bg-secondary border-0 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">رقم الهاتف</label>
              <Input
                placeholder="+20 xxx xxx xxxx"
                value={newContact.phone}
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                className="bg-secondary border-0 rounded-xl"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">البريد الإلكتروني</label>
              <Input
                placeholder="email@example.com"
                value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                className="bg-secondary border-0 rounded-xl"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">صلة القرابة</label>
              <div className="flex flex-wrap gap-2">
                {["أب", "أم", "أخ", "أخت", "زوج", "زوجة", "صديق", "زميل"].map((rel) => (
                  <button
                    key={rel}
                    type="button"
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
                className="flex-1 rounded-xl"
                onClick={() => setShowAddModal(false)}
              >
                إلغاء
              </Button>
              <Button
                className="flex-1 rounded-xl bg-primary"
                onClick={handleAddContact}
              >
                إضافة
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
  onShare,
  onToggleFavorite,
  onDelete,
}: {
  contact: Contact;
  onShare: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
}) {
  const [showActions, setShowActions] = useState(false);

  return (
    <Card className="p-4 card-shadow">
      <div className="flex items-center gap-3">
        <Avatar className="w-12 h-12">
          <AvatarFallback className="bg-primary text-primary-foreground">
            {contact.name[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{contact.name}</span>
            {contact.relation && (
              <Badge variant="secondary" className="text-xs">
                {contact.relation}
              </Badge>
            )}
          </div>
          {contact.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="w-3 h-3" />
              <span className="truncate">{contact.phone}</span>
            </div>
          )}
        </div>
        
        {/* Quick Share Button */}
        <Button
          onClick={onShare}
          size="sm"
          className="rounded-xl bg-primary shrink-0"
        >
          <MapPin className="w-4 h-4 ml-1" />
          شارك
        </Button>

        {/* Actions */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => setShowActions(!showActions)}
          >
            <MoreVertical className="w-5 h-5 text-muted-foreground" />
          </Button>
          
          {showActions && (
            <div className="absolute left-0 top-full mt-1 bg-card rounded-xl shadow-lg border border-border p-2 z-50 min-w-[150px]">
              <button
                onClick={() => {
                  onToggleFavorite();
                  setShowActions(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted text-sm"
              >
                {contact.isFavorite ? (
                  <>
                    <StarOff className="w-4 h-4" />
                    إزالة من المفضلة
                  </>
                ) : (
                  <>
                    <Star className="w-4 h-4" />
                    إضافة للمفضلة
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  onDelete();
                  setShowActions(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-destructive/10 text-destructive text-sm"
              >
                <Trash2 className="w-4 h-4" />
                حذف
              </button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
