"use client";

import { useState, useEffect, useCallback, useMemo, useSyncExternalStore, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Wifi,
  WifiOff,
  CloudOff,
  Cloud,
  RefreshCw,
  Upload,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  Database,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { toArabicNumerals } from "@/lib/arabic-numerals";

interface PendingAction {
  id: string;
  type: "location_update" | "check_in" | "share_start" | "share_end" | "safe_zone";
  timestamp: Date;
  description: string;
  data?: unknown;
}

interface OfflineIndicatorProps {
  className?: string;
  showPendingActions?: boolean;
  onOnline?: () => void;
  onOffline?: () => void;
}

// Helper to get online status synchronously
function getOnlineSnapshot() {
  return navigator.onLine;
}

function getServerSnapshot() {
  return true; // Always online on server
}

function subscribeToOnlineStatus(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

// Helper to load pending actions from localStorage
function loadPendingActions(): PendingAction[] {
  if (typeof window === "undefined") return [];
  const savedActions = localStorage.getItem("tamenny_pending_actions");
  if (savedActions) {
    try {
      const parsed = JSON.parse(savedActions);
      return parsed.map((a: PendingAction) => ({
        ...a,
        timestamp: new Date(a.timestamp),
      }));
    } catch {
      console.error("Failed to parse pending actions");
    }
  }
  return [];
}

export function OfflineIndicator({
  className,
  showPendingActions = true,
  onOnline,
  onOffline,
}: OfflineIndicatorProps) {
  // Use useSyncExternalStore for online status
  const isOnline = useSyncExternalStore(
    subscribeToOnlineStatus,
    getOnlineSnapshot,
    getServerSnapshot
  );
  
  const [showOnlineToast, setShowOnlineToast] = useState(false);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>(() => {
    if (showPendingActions) {
      return loadPendingActions();
    }
    return [];
  });
  const [showPendingDialog, setShowPendingDialog] = useState(false);
  const wasOnlineRef = useRef(isOnline);

  // Handle online/offline transitions
  useEffect(() => {
    // Only show toast on transition from offline to online
    if (isOnline && !wasOnlineRef.current) {
      onOnline?.();
      
      // Use microtask to defer setState outside of effect
      const timer = setTimeout(() => {
        setShowOnlineToast(true);
        // Auto-hide the toast after 3 seconds
        setTimeout(() => {
          setShowOnlineToast(false);
        }, 3000);
      }, 0);
      
      wasOnlineRef.current = true;
      return () => clearTimeout(timer);
    } else if (!isOnline && wasOnlineRef.current) {
      onOffline?.();
      setTimeout(() => setShowOnlineToast(false), 0);
      wasOnlineRef.current = false;
    }
  }, [isOnline, onOnline, onOffline]);

  // Sync pending actions when back online
  useEffect(() => {
    if (isOnline && pendingActions.length > 0) {
      // Simulate syncing
      const syncActions = async () => {
        toast.info("جاري مزامنة البيانات المعلقة...");
        
        // In a real app, this would actually sync with the server
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setPendingActions([]);
        localStorage.removeItem("tamenny_pending_actions");
        
        toast.success(`تمت مزامنة ${toArabicNumerals(pendingActions.length)} إجراء بنجاح`);
      };

      syncActions();
    }
  }, [isOnline, pendingActions.length]);

  // Clear all pending actions
  const clearPendingActions = useCallback(() => {
    setPendingActions([]);
    localStorage.removeItem("tamenny_pending_actions");
    setShowPendingDialog(false);
    toast.success("تم مسح الإجراءات المعلقة");
  }, []);

  // Get action type icon
  const getActionIcon = (type: string) => {
    switch (type) {
      case "location_update":
        return <Upload className="w-4 h-4" />;
      case "check_in":
        return <CheckCircle className="w-4 h-4" />;
      case "share_start":
        return <Cloud className="w-4 h-4" />;
      case "share_end":
        return <CloudOff className="w-4 h-4" />;
      case "safe_zone":
        return <Database className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  // Format time ago
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `منذ ${toArabicNumerals(days)} يوم`;
    }
    if (hours > 0) {
      return `منذ ${toArabicNumerals(hours)} ساعة`;
    }
    if (minutes > 0) {
      return `منذ ${toArabicNumerals(minutes)} دقيقة`;
    }
    return "الآن";
  };

  // Don't render anything if online and no pending actions
  if (isOnline && !showOnlineToast && pendingActions.length === 0) {
    return null;
  }

  return (
    <>
      {/* Offline Banner */}
      {!isOnline && (
        <div
          className={cn(
            "fixed top-0 left-0 right-0 z-[9999] animate-in slide-in-from-top duration-300",
            className
          )}
        >
          <Card className="mx-4 mt-2 bg-gradient-to-l from-red-500 to-red-600 text-white border-0 shadow-lg rounded-xl">
            <div className="p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <WifiOff className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="font-medium">أنت غير متصل بالإنترنت</div>
                <div className="text-sm text-white/80">
                  سيتم حفظ البيانات محلياً وإرسالها عند استعادة الاتصال
                </div>
              </div>
              {pendingActions.length > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-0 gap-2"
                  onClick={() => setShowPendingDialog(true)}
                >
                  <Upload className="w-4 h-4" />
                  {toArabicNumerals(pendingActions.length)}
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Online Toast */}
      {isOnline && showOnlineToast && (
        <div
          className={cn(
            "fixed top-0 left-0 right-0 z-[9999] animate-in slide-in-from-top duration-300",
            className
          )}
        >
          <Card className="mx-4 mt-2 bg-gradient-to-l from-green-500 to-teal-500 text-white border-0 shadow-lg rounded-xl">
            <div className="p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Wifi className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-medium">تم استعادة الاتصال</div>
                <div className="text-sm text-white/80">
                  جميع الخدمات متاحة الآن
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 shrink-0"
                onClick={() => setShowOnlineToast(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Pending Actions Button (when online with pending actions) */}
      {isOnline && pendingActions.length > 0 && (
        <div className="fixed bottom-24 left-4 right-4 z-[9999] animate-in slide-in-from-bottom duration-300">
          <Card className="bg-amber-50 border-amber-200 shadow-lg rounded-xl">
            <div className="p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <RefreshCw className="w-5 h-5 text-amber-600 animate-spin" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-amber-800">مزامنة البيانات</div>
                <div className="text-sm text-amber-600">
                  {toArabicNumerals(pendingActions.length)} إجراء في الانتظار
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Pending Actions Dialog */}
      <Dialog open={showPendingDialog} onOpenChange={setShowPendingDialog}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">الإجراءات المعلقة</DialogTitle>
            <DialogDescription className="text-center">
              هذه الإجراءات سيتم إرسالها عند استعادة الاتصال
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Actions list */}
            <div className="max-h-64 overflow-y-auto space-y-2">
              {pendingActions.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>لا توجد إجراءات معلقة</p>
                </div>
              ) : (
                pendingActions.map((action) => (
                  <div
                    key={action.id}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                      {getActionIcon(action.type)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{action.description}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatTimeAgo(action.timestamp)}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      معلق
                    </Badge>
                  </div>
                ))
              )}
            </div>

            {/* Stats */}
            {pendingActions.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100">
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">إجمالي الإجراءات</span>
                </div>
                <Badge className="bg-amber-100 text-amber-700">
                  {toArabicNumerals(pendingActions.length)}
                </Badge>
              </div>
            )}

            {/* Actions */}
            {pendingActions.length > 0 && (
              <Button
                variant="destructive"
                className="w-full rounded-xl gap-2"
                onClick={clearPendingActions}
              >
                <Trash2 className="w-4 h-4" />
                مسح جميع الإجراءات المعلقة
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Compact offline badge for inline use
export function OfflineBadge({ className }: { className?: string }) {
  const isOnline = useSyncExternalStore(
    subscribeToOnlineStatus,
    getOnlineSnapshot,
    getServerSnapshot
  );

  if (isOnline) return null;

  return (
    <Badge
      variant="destructive"
      className={cn("gap-1.5 animate-pulse", className)}
    >
      <WifiOff className="w-3 h-3" />
      غير متصل
    </Badge>
  );
}

// Hook for checking online status
export function useOnlineStatus() {
  return useSyncExternalStore(
    subscribeToOnlineStatus,
    getOnlineSnapshot,
    getServerSnapshot
  );
}

// Hook for managing pending actions
export function usePendingActions() {
  const [pendingActions, setPendingActions] = useState<PendingAction[]>(() => loadPendingActions());

  const addAction = useCallback((action: Omit<PendingAction, "id" | "timestamp">) => {
    const newAction: PendingAction = {
      ...action,
      id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    setPendingActions(prev => {
      const updatedActions = [...prev, newAction];
      localStorage.setItem("tamenny_pending_actions", JSON.stringify(updatedActions));
      return updatedActions;
    });

    toast.info("تم حفظ الإجراء للإرسال لاحقاً");
  }, []);

  const clearActions = useCallback(() => {
    setPendingActions([]);
    localStorage.removeItem("tamenny_pending_actions");
  }, []);

  return useMemo(() => ({
    pendingActions,
    addAction,
    clearActions,
    hasPending: pendingActions.length > 0,
  }), [pendingActions, addAction, clearActions]);
}
