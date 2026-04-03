"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Plus,
  MapPin,
  Navigation,
  Clock,
  UserPlus,
  MoreVertical,
  Search,
} from "lucide-react";
import { BottomNav, Header } from "@/components/tamenny/bottom-nav";
import { toast } from "sonner";

// Mock groups data
const MOCK_GROUPS = [
  {
    id: "1",
    name: "رحلة العمل",
    members: [
      { name: "أحمد", color: "#0D7377" },
      { name: "محمد", color: "#FF6B6B" },
      { name: "سارة", color: "#4ECDC4" },
    ],
    destination: "المكتب",
    status: "active",
    eta: 15,
  },
  {
    id: "2",
    name: "العائلة",
    members: [
      { name: "ماما", color: "#FF6B6B" },
      { name: "بابا", color: "#0D7377" },
    ],
    destination: "البيت",
    status: "completed",
    eta: 0,
  },
  {
    id: "3",
    name: "أصدقاء الجامعة",
    members: [
      { name: "علي", color: "#4ECDC4" },
      { name: "خالد", color: "#FF6B6B" },
      { name: "عمر", color: "#0D7377" },
      { name: "يوسف", color: "#9B59B6" },
    ],
    destination: "الكافيه",
    status: "pending",
    eta: null,
  },
];

export default function GroupsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const handleCreateGroup = () => {
    toast.info("إنشاء مجموعة جديدة - قريباً");
  };

  return (
    <main className="min-h-screen bg-background pb-20">
      <Header />

      <div className="pt-16 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">المجموعات</h1>
          <Button
            onClick={handleCreateGroup}
            className="bg-primary rounded-xl"
          >
            <Plus className="w-4 h-4 ml-2" />
            مجموعة جديدة
          </Button>
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
          {MOCK_GROUPS.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>

        {/* Empty state */}
        {MOCK_GROUPS.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium text-lg mb-2">لا توجد مجموعات</h3>
            <p className="text-muted-foreground text-sm">
              أنشئ مجموعة لمشاركة موقعك مع عدة أشخاص
            </p>
          </div>
        )}

        {/* Info card */}
        <Card className="mt-6 p-4 bg-primary/10 border-0">
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-medium text-primary">مشاركة جماعية</h4>
              <p className="text-sm text-muted-foreground mt-1">
                يمكنك مشاركة موقعك مع حتى ٥ أشخاص في نفس الوقت. كل شخص سيظهر بلون مختلف على الخريطة.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <BottomNav />
    </main>
  );
}

function GroupCard({ group }: { group: typeof MOCK_GROUPS[0] }) {
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

  return (
    <Card className="p-4 card-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium">{group.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${statusColors[group.status]}`} />
                {statusLabels[group.status]}
              </span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon">
          <MoreVertical className="w-5 h-5 text-muted-foreground" />
        </Button>
      </div>

      {/* Members */}
      <div className="flex items-center gap-2 mb-3">
        {group.members.map((member, index) => (
          <div key={index} className="relative -mr-2 last:mr-0">
            <Avatar
              className="w-8 h-8 border-2 border-card"
              style={{ borderColor: member.color }}
            >
              <AvatarFallback
                className="text-xs text-white"
                style={{ backgroundColor: member.color }}
              >
                {member.name[0]}
              </AvatarFallback>
            </Avatar>
          </div>
        ))}
        <span className="text-sm text-muted-foreground mr-2">
          {group.members.length} أعضاء
        </span>
      </div>

      {/* Destination & ETA */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-primary" />
          <span>{group.destination}</span>
        </div>
        {group.eta !== null && group.status === "active" && (
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            <Clock className="w-3 h-3 ml-1" />
            {group.eta} دقيقة
          </Badge>
        )}
      </div>
    </Card>
  );
}
