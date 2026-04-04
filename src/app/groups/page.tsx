"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Users,
  Plus,
  MapPin,
  Navigation,
  Clock,
  UserPlus,
  MoreVertical,
  Search,
  Settings,
  Share2,
  Activity,
  TrendingUp,
  Calendar,
  Zap,
  Crown,
  Circle,
  X,
  Edit3,
  Trash2,
  LogOut,
  Bell,
  BellOff,
  Loader2,
} from "lucide-react";
import { BottomNav, Header } from "@/components/tamenny/bottom-nav";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

// Types
interface GroupMember {
  id: string;
  userId: string;
  name: string;
  avatar: string | null;
  role: "admin" | "member";
  joinedAt: string;
  isOnline?: boolean;
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  createdAt: string;
  userRole: "admin" | "member";
  members: GroupMember[];
  onlineCount?: number;
}

export default function GroupsPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [isQuickSharing, setIsQuickSharing] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch groups from API
  const fetchGroups = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const response = await fetch("/api/groups");
      const data = await response.json();

      if (data.success) {
        setGroups(data.groups);
        setError(null);
      } else {
        setError(data.error || "فشل في تحميل المجموعات");
      }
    } catch (err) {
      console.error("Error fetching groups:", err);
      setError("فشل في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch groups when user is available
  useEffect(() => {
    if (user?.id) {
      fetchGroups();
    }
  }, [user?.id, fetchGroups]);

  const filteredGroups = groups.filter(
    (group) =>
      group.name.includes(searchQuery) ||
      group.members.some((m) => m.name.includes(searchQuery))
  );

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error("الرجاء إدخال اسم المجموعة");
      return;
    }

    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newGroupName,
          description: newGroupDesc,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setGroups([...groups, data.group]);
        setShowCreateDialog(false);
        setNewGroupName("");
        setNewGroupDesc("");
        toast.success("تم إنشاء المجموعة بنجاح");
      } else {
        toast.error(data.error || "فشل في إنشاء المجموعة");
      }
    } catch (err) {
      console.error("Error creating group:", err);
      toast.error("فشل في إنشاء المجموعة");
    }
  };

  const handleAddMember = async () => {
    if (!newMemberName.trim() || !selectedGroup) {
      toast.error("الرجاء إدخال اسم العضو");
      return;
    }

    setIsAddingMember(true);

    try {
      // Search for the user by email or name
      const searchResponse = await fetch(`/api/users/search?q=${encodeURIComponent(newMemberName)}`);
      const searchData = await searchResponse.json();

      if (!searchData.success || !searchData.users || searchData.users.length === 0) {
        toast.error("لم يتم العثور على مستخدم بهذا الاسم أو البريد الإلكتروني. يمكنك دعوتهم عبر البريد الإلكتروني أو الهاتف بدلاً من ذلك.");
        setIsAddingMember(false);
        return;
      }

      // If multiple users found, use the first one (could show a selection dialog in future)
      const userToAdd = searchData.users[0];

      // Check if user is already a member
      if (selectedGroup.members.some(m => m.userId === userToAdd.id)) {
        toast.error("هذا المستخدم عضو بالفعل في المجموعة");
        setIsAddingMember(false);
        return;
      }

      // Add the member to the group
      const addResponse = await fetch(`/api/groups/${selectedGroup.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          addMemberUserId: userToAdd.id,
        }),
      });

      const addData = await addResponse.json();

      if (addData.success) {
        toast.success(`تمت إضافة ${userToAdd.name} إلى المجموعة`);
        setShowAddMemberDialog(false);
        setNewMemberName("");
        // Refresh the groups list
        fetchGroups();
      } else {
        toast.error(addData.error || "فشل في إضافة العضو");
      }
    } catch (err) {
      console.error("Error adding member:", err);
      toast.error("فشل في إضافة العضو");
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleQuickShare = async (group: Group) => {
    setIsQuickSharing(true);

    try {
      // Get user's current location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("المتصفح لا يدعم تحديد الموقع"));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;

      // Create a location sharing session
      const response = await fetch('/api/sessions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          duration: 60, // Default 60 minutes
          startLat: latitude,
          startLng: longitude,
          sessionType: 'minutes',
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`تم بدء المشاركة مع ${group.name}`);
        // Navigate to the share page to show the link
        if (data.shareUrl) {
          // Copy to clipboard and show the link
          try {
            await navigator.clipboard.writeText(data.shareUrl);
            toast.success("تم نسخ رابط المشاركة إلى الحافظة");
          } catch {
            // If clipboard fails, just show the link
            toast.info(`رابط المشاركة: ${data.shareUrl}`);
          }
          // Navigate to the share page
          router.push(`/share/${data.encryptedId}`);
        }
      } else {
        toast.error(data.error || "فشل في بدء المشاركة");
      }
    } catch (err) {
      console.error("Error starting quick share:", err);
      if (err instanceof GeolocationPositionError) {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            toast.error("تم رفض إذن تحديد الموقع. يرجى السماح بالوصول للموقع.");
            break;
          case err.POSITION_UNAVAILABLE:
            toast.error("معلومات الموقع غير متاحة حالياً");
            break;
          case err.TIMEOUT:
            toast.error("انتهت مهلة تحديد الموقع. يرجى المحاولة مرة أخرى.");
            break;
          default:
            toast.error("فشل في تحديد الموقع");
        }
      } else {
        toast.error("فشل في بدء المشاركة. يرجى المحاولة مرة أخرى.");
      }
    } finally {
      setIsQuickSharing(false);
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}?action=leave`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setGroups(groups.filter((g) => g.id !== groupId));
        setShowSettingsDialog(false);
        toast.success("تم مغادرة المجموعة");
      } else {
        toast.error(data.error || "فشل في مغادرة المجموعة");
      }
    } catch (err) {
      console.error("Error leaving group:", err);
      toast.error("فشل في مغادرة المجموعة");
    }
  };

  const openSettings = (group: Group) => {
    setSelectedGroup(group);
    setShowSettingsDialog(true);
  };

  const openAddMember = (group: Group) => {
    setSelectedGroup(group);
    setShowAddMemberDialog(true);
  };

  // Calculate stats from real data
  const totalGroups = groups.length;
  const activeGroups = groups.length; // All groups are considered active for now
  const totalMembers = groups.reduce((acc, g) => acc + g.members.length, 0);
  const onlineMembers = groups.reduce(
    (acc, g) => acc + (g.onlineCount || 0),
    0
  );

  return (
    <main className="min-h-screen bg-background pb-20">
      <Header />

      <div className="pt-16 px-4">
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
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold">المجموعات</h1>
                <p className="text-sm text-muted-foreground">
                  {totalGroups} مجموعات • {onlineMembers} مشارك الآن
                </p>
              </div>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-primary rounded-xl"
              >
                <Plus className="w-4 h-4 ml-2" />
                مجموعة جديدة
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <Card className="p-3 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <div>
                    <div className="text-lg font-bold">{totalGroups}</div>
                    <div className="text-xs text-muted-foreground">مجموعة</div>
                  </div>
                </div>
              </Card>
              <Card className="p-3 bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/20 dark:to-green-900/10 border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-600" />
                  <div>
                    <div className="text-lg font-bold text-green-600">{activeGroups}</div>
                    <div className="text-xs text-green-600/70">نشطة</div>
                  </div>
                </div>
              </Card>
              <Card className="p-3 bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/20 dark:to-purple-900/10 border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-purple-600" />
                  <div>
                    <div className="text-lg font-bold text-purple-600">{totalMembers}</div>
                    <div className="text-xs text-purple-600/70">أعضاء</div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="بحث في المجموعات..."
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
                <Button onClick={fetchGroups} variant="outline">
                  إعادة المحاولة
                </Button>
              </Card>
            )}

            {/* Groups list */}
            {!loading && !error && (
              <div className="space-y-4">
                {filteredGroups.map((group) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    onQuickShare={handleQuickShare}
                    onSettings={openSettings}
                    onAddMember={openAddMember}
                  />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && filteredGroups.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium text-lg mb-2">لا توجد مجموعات</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  أنشئ مجموعة لمشاركة موقعك مع عدة أشخاص
                </p>
                <Button onClick={() => setShowCreateDialog(true)} variant="outline" className="rounded-xl">
                  <Plus className="w-4 h-4 ml-2" />
                  إنشاء مجموعة
                </Button>
              </div>
            )}

            {/* Info card */}
            {!loading && !error && groups.length > 0 && (
              <Card className="mt-6 p-4 bg-primary/10 border-0">
                <div className="flex items-start gap-3">
                  <Share2 className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium text-primary">مشاركة جماعية</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      يمكنك مشاركة موقعك مع حتى ٥ أشخاص في نفس الوقت. كل شخص سيظهر بلون مختلف على الخريطة.
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Create Group Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إنشاء مجموعة جديدة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>اسم المجموعة</Label>
              <Input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="مثال: العائلة، العمل..."
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label>الوصف (اختياري)</Label>
              <Input
                value={newGroupDesc}
                onChange={(e) => setNewGroupDesc(e.target.value)}
                placeholder="وصف المجموعة..."
                className="text-right"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              إلغاء
            </Button>
            <Button className="bg-primary" onClick={handleCreateGroup}>
              إنشاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إعدادات المجموعة</DialogTitle>
          </DialogHeader>
          {selectedGroup && (
            <div className="space-y-4 py-4">
              {/* Group Info */}
              <Card className="p-4 bg-muted/50">
                <h4 className="font-medium">{selectedGroup.name}</h4>
                {selectedGroup.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedGroup.description}
                  </p>
                )}
              </Card>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">{selectedGroup.members.length} أعضاء</span>
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      {new Date(selectedGroup.createdAt).toLocaleDateString("ar-EG", { month: "short" })}
                    </span>
                  </div>
                </Card>
              </div>

              {/* Members List */}
              <div className="space-y-2">
                <Label>الأعضاء ({selectedGroup.members.length})</Label>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {selectedGroup.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {member.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{member.name}</span>
                            {member.role === "admin" && (
                              <Crown className="w-3 h-3 text-yellow-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2">
                <Button
                  variant="outline"
                  className="w-full justify-start text-destructive hover:bg-destructive/10"
                  onClick={() => handleLeaveGroup(selectedGroup.id)}
                >
                  <LogOut className="w-4 h-4 ml-2" />
                  مغادرة المجموعة
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة عضو جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>البحث عن عضو</Label>
              <Input
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="اسم المستخدم أو البريد الإلكتروني..."
                className="text-right"
                disabled={isAddingMember}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              ابحث عن مستخدم مسجل في التطبيق بإسمه أو بريده الإلكتروني لإضافته إلى {selectedGroup?.name}
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAddMemberDialog(false)} disabled={isAddingMember}>
              إلغاء
            </Button>
            <Button className="bg-primary" onClick={handleAddMember} disabled={isAddingMember}>
              {isAddingMember ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري الإضافة...
                </>
              ) : (
                "إضافة"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </main>
  );
}

// Group Card Component
function GroupCard({
  group,
  onQuickShare,
  onSettings,
  onAddMember,
}: {
  group: Group;
  onQuickShare: (group: Group) => void;
  onSettings: (group: Group) => void;
  onAddMember: (group: Group) => void;
}) {
  const onlineCount = group.onlineCount || 0;

  return (
    <Card className="p-4 card-shadow hover:shadow-lg transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-medium">{group.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                نشطة
              </span>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onSettings(group)}
        >
          <Settings className="w-5 h-5 text-muted-foreground" />
        </Button>
      </div>

      {/* Members */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center -space-x-2 space-x-reverse">
          {group.members.slice(0, 5).map((member, index) => (
            <div key={member.id} className="relative">
              <Avatar className="w-9 h-9 border-2 border-card">
                <AvatarFallback
                  className="text-xs text-white font-medium bg-primary"
                >
                  {member.name[0]}
                </AvatarFallback>
              </Avatar>
              {/* Admin crown */}
              {member.role === "admin" && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2">
                  <Crown className="w-3 h-3 text-yellow-500" />
                </div>
              )}
            </div>
          ))}
          {group.members.length > 5 && (
            <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-card">
              +{group.members.length - 5}
            </div>
          )}
        </div>
        <div className="flex-1 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-green-600">{onlineCount} مشارك</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {group.members.length} أعضاء
          </div>
        </div>
      </div>

      {/* Group Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3 p-2 rounded-lg bg-muted/50">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-primary">
            <TrendingUp className="w-3 h-3" />
            <span className="font-bold">{group.members.length}</span>
          </div>
          <div className="text-xs text-muted-foreground">أعضاء</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-green-600">
            <Activity className="w-3 h-3" />
            <span className="font-bold">{onlineCount}</span>
          </div>
          <div className="text-xs text-muted-foreground">نشط</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <Calendar className="w-3 h-3" />
            <span className="font-bold text-xs">
              {new Date(group.createdAt).toLocaleDateString("ar-EG", { month: "short" })}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">إنشاء</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1 rounded-xl"
          onClick={() => onAddMember(group)}
        >
          <UserPlus className="w-4 h-4 ml-2" />
          إضافة عضو
        </Button>
        <Button
          className="flex-1 rounded-xl bg-primary"
          onClick={() => onQuickShare(group)}
        >
          <Share2 className="w-4 h-4 ml-2" />
          مشاركة سريعة
        </Button>
      </div>
    </Card>
  );
}
