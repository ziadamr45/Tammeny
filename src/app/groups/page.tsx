"use client";

import { useState } from "react";
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
  CheckCircle2,
  Circle,
  X,
  Edit3,
  Trash2,
  LogOut,
  Bell,
  BellOff,
} from "lucide-react";
import { BottomNav, Header } from "@/components/tamenny/bottom-nav";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Types
interface GroupMember {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  isOnline: boolean;
  isSharing: boolean;
  lastSeen?: Date;
  role: "admin" | "member";
}

interface GroupStats {
  totalTrips: number;
  activeMembers: number;
  lastActive: Date;
}

interface Group {
  id: string;
  name: string;
  description?: string;
  members: GroupMember[];
  destination: string;
  status: "active" | "completed" | "pending";
  eta: number | null;
  stats: GroupStats;
  notifications: boolean;
  createdAt: Date;
}

// Mock groups data with enhanced details
const MOCK_GROUPS: Group[] = [
  {
    id: "1",
    name: "رحلة العمل",
    description: "مشاركة الموقع مع زملاء العمل",
    members: [
      { id: "m1", name: "أحمد", color: "#0D7377", isOnline: true, isSharing: true, role: "admin" },
      { id: "m2", name: "محمد", color: "#FF6B6B", isOnline: true, isSharing: false, role: "member" },
      { id: "m3", name: "سارة", color: "#4ECDC4", isOnline: false, isSharing: false, role: "member", lastSeen: new Date(Date.now() - 3600000) },
    ],
    destination: "المكتب",
    status: "active",
    eta: 15,
    stats: { totalTrips: 24, activeMembers: 3, lastActive: new Date() },
    notifications: true,
    createdAt: new Date("2025-01-15"),
  },
  {
    id: "2",
    name: "العائلة",
    description: "تواصل دائم مع العائلة",
    members: [
      { id: "m4", name: "ماما", color: "#FF6B6B", isOnline: true, isSharing: true, role: "admin" },
      { id: "m5", name: "بابا", color: "#0D7377", isOnline: false, isSharing: false, role: "member", lastSeen: new Date(Date.now() - 7200000) },
    ],
    destination: "البيت",
    status: "completed",
    eta: 0,
    stats: { totalTrips: 156, activeMembers: 2, lastActive: new Date(Date.now() - 86400000) },
    notifications: true,
    createdAt: new Date("2024-12-01"),
  },
  {
    id: "3",
    name: "أصدقاء الجامعة",
    description: "لقاءات الأصدقاء",
    members: [
      { id: "m6", name: "علي", color: "#4ECDC4", isOnline: true, isSharing: false, role: "admin" },
      { id: "m7", name: "خالد", color: "#FF6B6B", isOnline: false, isSharing: false, role: "member" },
      { id: "m8", name: "عمر", color: "#0D7377", isOnline: true, isSharing: true, role: "member" },
      { id: "m9", name: "يوسف", color: "#9B59B6", isOnline: false, isSharing: false, role: "member" },
    ],
    destination: "الكافيه",
    status: "pending",
    eta: null,
    stats: { totalTrips: 12, activeMembers: 4, lastActive: new Date(Date.now() - 172800000) },
    notifications: false,
    createdAt: new Date("2025-02-20"),
  },
];

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>(MOCK_GROUPS);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [newMemberName, setNewMemberName] = useState("");

  const filteredGroups = groups.filter(
    (group) =>
      group.name.includes(searchQuery) ||
      group.members.some((m) => m.name.includes(searchQuery))
  );

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      toast.error("الرجاء إدخال اسم المجموعة");
      return;
    }

    const newGroup: Group = {
      id: Date.now().toString(),
      name: newGroupName,
      description: newGroupDesc,
      members: [
        { id: "me", name: "أنا", color: "#0D7377", isOnline: true, isSharing: false, role: "admin" },
      ],
      destination: "",
      status: "pending",
      eta: null,
      stats: { totalTrips: 0, activeMembers: 1, lastActive: new Date() },
      notifications: true,
      createdAt: new Date(),
    };

    setGroups([...groups, newGroup]);
    setShowCreateDialog(false);
    setNewGroupName("");
    setNewGroupDesc("");
    toast.success("تم إنشاء المجموعة بنجاح");
  };

  const handleAddMember = () => {
    if (!newMemberName.trim() || !selectedGroup) {
      toast.error("الرجاء إدخال اسم العضو");
      return;
    }

    const colors = ["#0D7377", "#FF6B6B", "#4ECDC4", "#9B59B6", "#E74C3C", "#3498DB"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newMember: GroupMember = {
      id: Date.now().toString(),
      name: newMemberName,
      color: randomColor,
      isOnline: false,
      isSharing: false,
      role: "member",
    };

    setGroups(
      groups.map((g) =>
        g.id === selectedGroup.id
          ? { ...g, members: [...g.members, newMember] }
          : g
      )
    );

    setShowAddMemberDialog(false);
    setNewMemberName("");
    toast.success("تم إضافة العضو بنجاح");
  };

  const handleQuickShare = (group: Group) => {
    toast.success(`تم بدء المشاركة مع ${group.name}`);
  };

  const handleToggleNotifications = (groupId: string) => {
    setGroups(
      groups.map((g) =>
        g.id === groupId ? { ...g, notifications: !g.notifications } : g
      )
    );
    const group = groups.find((g) => g.id === groupId);
    toast.success(group?.notifications ? "تم إيقاف الإشعارات" : "تم تفعيل الإشعارات");
  };

  const handleLeaveGroup = (groupId: string) => {
    setGroups(groups.filter((g) => g.id !== groupId));
    setShowSettingsDialog(false);
    toast.success("تم مغادرة المجموعة");
  };

  const openSettings = (group: Group) => {
    setSelectedGroup(group);
    setShowSettingsDialog(true);
  };

  const openAddMember = (group: Group) => {
    setSelectedGroup(group);
    setShowAddMemberDialog(true);
  };

  // Calculate stats
  const totalGroups = groups.length;
  const activeGroups = groups.filter((g) => g.status === "active").length;
  const totalMembers = groups.reduce((acc, g) => acc + g.members.length, 0);
  const onlineMembers = groups.reduce(
    (acc, g) => acc + g.members.filter((m) => m.isOnline).length,
    0
  );

  return (
    <main className="min-h-screen bg-background pb-20">
      <Header />

      <div className="pt-16 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">المجموعات</h1>
            <p className="text-sm text-muted-foreground">
              {totalGroups} مجموعات • {onlineMembers} متصل الآن
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

        {/* Groups list */}
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

        {/* Empty state */}
        {filteredGroups.length === 0 && (
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

              {/* Notifications Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                <div className="flex items-center gap-2">
                  {selectedGroup.notifications ? (
                    <Bell className="w-5 h-5 text-primary" />
                  ) : (
                    <BellOff className="w-5 h-5 text-muted-foreground" />
                  )}
                  <span>الإشعارات</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleNotifications(selectedGroup.id)}
                >
                  {selectedGroup.notifications ? "تعطيل" : "تفعيل"}
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">{selectedGroup.stats.totalTrips} رحلة</span>
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      {selectedGroup.members.filter((m) => m.isOnline).length} متصل
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
                        <Avatar className="w-8 h-8" style={{ borderColor: member.color, borderWidth: 2 }}>
                          <AvatarFallback style={{ backgroundColor: member.color, color: "white" }}>
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
                          <div className="flex items-center gap-1">
                            {member.isOnline ? (
                              <span className="text-xs text-green-600">متصل</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">غير متصل</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {member.isSharing && (
                        <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                          <Navigation className="w-3 h-3 ml-1" />
                          مشاركة
                        </Badge>
                      )}
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
              <Label>اسم العضو</Label>
              <Input
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="اسم العضو..."
                className="text-right"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              سيتم إرسال دعوة للعضو للانضمام إلى {selectedGroup?.name}
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAddMemberDialog(false)}>
              إلغاء
            </Button>
            <Button className="bg-primary" onClick={handleAddMember}>
              إضافة
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
  const statusColors = {
    active: "bg-green-500",
    completed: "bg-gray-400",
    pending: "bg-yellow-500",
  };

  const statusLabels = {
    active: "نشطة",
    completed: "مكتملة",
    pending: "في الانتظار",
  };

  const onlineCount = group.members.filter((m) => m.isOnline).length;
  const sharingCount = group.members.filter((m) => m.isSharing).length;

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
                <div className={`w-2 h-2 rounded-full ${statusColors[group.status]} animate-pulse`} />
                {statusLabels[group.status]}
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

      {/* Members with Online Status */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center -space-x-2 space-x-reverse">
          {group.members.slice(0, 5).map((member, index) => (
            <div key={member.id} className="relative">
              <Avatar
                className="w-9 h-9 border-2 border-card"
                style={{ borderColor: member.isOnline ? "#22c55e" : "transparent" }}
              >
                <AvatarFallback
                  className="text-xs text-white font-medium"
                  style={{ backgroundColor: member.color }}
                >
                  {member.name[0]}
                </AvatarFallback>
              </Avatar>
              {/* Online indicator */}
              <div
                className={cn(
                  "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card",
                  member.isOnline ? "bg-green-500" : "bg-gray-400"
                )}
              />
              {/* Sharing indicator */}
              {member.isSharing && (
                <div className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                  <Navigation className="w-2 h-2 text-white" />
                </div>
              )}
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
            <span className="text-green-600">{onlineCount} متصل</span>
            {sharingCount > 0 && (
              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                <Zap className="w-3 h-3 ml-1" />
                {sharingCount} مشاركة
              </Badge>
            )}
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
            <span className="font-bold">{group.stats.totalTrips}</span>
          </div>
          <div className="text-xs text-muted-foreground">رحلة</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-green-600">
            <Activity className="w-3 h-3" />
            <span className="font-bold">{group.stats.activeMembers}</span>
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

      {/* Destination & ETA */}
      <div className="flex items-center justify-between pt-3 border-t border-border mb-3">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-primary" />
          <span>{group.destination || "لم يتم تحديد وجهة"}</span>
        </div>
        {group.eta !== null && group.status === "active" && (
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            <Clock className="w-3 h-3 ml-1" />
            {group.eta} دقيقة
          </Badge>
        )}
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
          disabled={group.status === "completed"}
        >
          <Share2 className="w-4 h-4 ml-2" />
          مشاركة سريعة
        </Button>
      </div>

      {/* Active Sharing Indicator */}
      {sharingCount > 0 && (
        <div className="mt-3 p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium">
              {sharingCount} {sharingCount === 1 ? "عضو يشارك" : "أعضاء يشاركون"} موقعهم الآن
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
