"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Send,
  Phone,
  Mic,
  MicOff,
  ArrowRight,
  MoreVertical,
  Search,
  Shield,
  MapPin,
  Navigation,
  Check,
  CheckCheck,
  Clock,
  Paperclip,
  Image as ImageIcon,
  Smile,
  Volume2,
  VolumeX,
  Bell,
  Star,
  Trash2,
  Archive,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BottomNav, Header } from "@/components/tamenny/bottom-nav";
import { toast } from "sonner";

// Mock chat data
const MOCK_CHATS = [
  {
    id: "1",
    name: "أحمد",
    lastMessage: "وصلت السلامة 👍",
    time: "منذ ٥ دقائق",
    unread: 2,
    online: true,
    isFavorite: true,
  },
  {
    id: "2",
    name: "محمد",
    lastMessage: "طيب، انتظرك",
    time: "منذ ساعة",
    unread: 0,
    online: false,
    isFavorite: false,
  },
  {
    id: "3",
    name: "سارة",
    lastMessage: "شكراً على التتبع",
    time: "أمس",
    unread: 0,
    online: true,
    isFavorite: true,
  },
  {
    id: "4",
    name: "مجموعة العائلة",
    lastMessage: "أمي: وصلتوا؟",
    time: "منذ ٣ ساعات",
    unread: 5,
    online: false,
    isGroup: true,
    isFavorite: false,
  },
];

const MOCK_MESSAGES = [
  {
    id: "1",
    sender: "them",
    text: "السلام عليكم، وينك دلوقتي؟",
    time: "١٠:٣٠ ص",
    status: "read",
  },
  {
    id: "2",
    sender: "me",
    text: "وعليكم السلام، أنا في الطريق",
    time: "١٠:٣١ ص",
    status: "read",
  },
  {
    id: "3",
    sender: "them",
    text: "طيب، فين بالظبط؟",
    time: "١٠:٣٢ ص",
    status: "read",
  },
  {
    id: "4",
    sender: "me",
    text: "شارك موقعي معاك، تابع من الرابط 👇",
    time: "١٠:٣٣ ص",
    status: "read",
    hasLocationShare: true,
  },
  {
    id: "5",
    sender: "them",
    text: "تمام، شايفك 👍",
    time: "١٠:٣٥ ص",
    status: "read",
  },
  {
    id: "6",
    sender: "them",
    text: "وصلت السلامة 👍",
    time: "١٠:٤٥ ص",
    status: "read",
  },
];

const QUICK_REPLIES = [
  "طمنّي عليك!",
  "أنا في الطريق",
  "وصلت!",
  "استنى شوية",
  "تمام 👍",
];

export default function ChatPage() {
  const [view, setView] = useState<"list" | "chat">("list");
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [showShareLocation, setShowShareLocation] = useState(false);
  const [showChatOptions, setShowChatOptions] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, []);

  // Simulate typing indicator
  useEffect(() => {
    if (view === "chat" && selectedChat) {
      const interval = setInterval(() => {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 2000);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [view, selectedChat]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    toast.success("تم إرسال الرسالة");
    setMessage("");
    scrollToBottom();
  };

  const handleQuickReply = (reply: string) => {
    setMessage(reply);
    setShowQuickReplies(false);
    handleSendMessage();
  };

  const handleShareLocation = () => {
    setShowShareLocation(false);
    toast.success("تم مشاركة موقعك!");
  };

  const handleSelectChat = (chatId: string) => {
    setSelectedChat(chatId);
    setView("chat");
  };

  const handleBack = () => {
    setView("list");
    setSelectedChat(null);
  };

  return (
    <main className="min-h-screen bg-background pb-20">
      <Header />

      {view === "list" ? (
        <ChatList
          chats={MOCK_CHATS}
          onSelectChat={handleSelectChat}
        />
      ) : (
        <ChatView
          messages={MOCK_MESSAGES}
          message={message}
          setMessage={setMessage}
          onSendMessage={handleSendMessage}
          onBack={handleBack}
          isRecording={isRecording}
          setIsRecording={setIsRecording}
          messagesEndRef={messagesEndRef}
          showQuickReplies={showQuickReplies}
          setShowQuickReplies={setShowQuickReplies}
          onQuickReply={handleQuickReply}
          onShareLocation={() => setShowShareLocation(true)}
          showChatOptions={showChatOptions}
          setShowChatOptions={setShowChatOptions}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
          isTyping={isTyping}
        />
      )}

      <BottomNav />

      {/* Share Location Modal */}
      <Dialog open={showShareLocation} onOpenChange={setShowShareLocation}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">مشاركة الموقع</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="w-10 h-10 text-primary" />
              </div>
            </div>
            
            <p className="text-center text-muted-foreground">
              سيتم إرسال رابط تتبع موقعك الحالي للمستلم
            </p>

            {/* Duration options */}
            <div className="space-y-2">
              {[
                { value: 5, label: "٥ دقائق", desc: "مشاركة سريعة" },
                { value: 30, label: "٣٠ دقيقة", desc: "رحلة قصيرة" },
                { value: 60, label: "ساعة", desc: "رحلة متوسطة" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={handleShareLocation}
                  className="w-full p-3 rounded-xl border-2 border-border hover:border-primary transition-all text-right"
                >
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-xs text-muted-foreground">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function ChatList({
  chats,
  onSelectChat,
}: {
  chats: typeof MOCK_CHATS;
  onSelectChat: (id: string) => void;
}) {
  return (
    <div className="pt-16 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">الرسائل</h1>
        <Badge variant="secondary" className="bg-primary/10 text-primary">
          {chats.reduce((acc, c) => acc + c.unread, 0)} غير مقروءة
        </Badge>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="بحث في المحادثات..."
          className="pr-10 rounded-xl bg-secondary border-0"
        />
      </div>

      {/* Favorites section */}
      <div className="mb-4">
        <h3 className="text-sm text-muted-foreground mb-2">المفضلة</h3>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {chats.filter(c => c.isFavorite).map((chat) => (
            <button
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className="flex flex-col items-center gap-1 shrink-0"
            >
              <div className="relative">
                <Avatar className="w-14 h-14 border-2 border-primary">
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                    {chat.name[0]}
                  </AvatarFallback>
                </Avatar>
                {chat.online && (
                  <div className="absolute bottom-0 left-0 w-4 h-4 bg-green-500 rounded-full border-2 border-card" />
                )}
              </div>
              <span className="text-xs truncate max-w-14">{chat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat list */}
      <div className="space-y-2">
        {chats.map((chat) => (
          <Card
            key={chat.id}
            className="p-4 card-shadow cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5 border border-transparent hover:border-primary/20"
            onClick={() => onSelectChat(chat.id)}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {chat.name[0]}
                  </AvatarFallback>
                </Avatar>
                {chat.online && (
                  <div className="absolute bottom-0 left-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card animate-pulse" />
                )}
                {chat.isGroup && (
                  <div className="absolute -top-1 -left-1 w-5 h-5 bg-secondary rounded-full flex items-center justify-center border-2 border-card">
                    <span className="text-xs">👥</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium flex items-center gap-1">
                    {chat.name}
                    {chat.isFavorite && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {chat.time}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground truncate">
                    {chat.lastMessage}
                  </p>
                  {chat.unread > 0 && (
                    <Badge className="bg-primary text-primary-foreground rounded-full px-2 h-5 min-w-5 flex items-center justify-center">
                      {chat.unread}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ChatView({
  messages,
  message,
  setMessage,
  onSendMessage,
  onBack,
  isRecording,
  setIsRecording,
  messagesEndRef,
  showQuickReplies,
  setShowQuickReplies,
  onQuickReply,
  onShareLocation,
  showChatOptions,
  setShowChatOptions,
  isMuted,
  setIsMuted,
  isTyping,
}: {
  messages: typeof MOCK_MESSAGES;
  message: string;
  setMessage: (msg: string) => void;
  onSendMessage: () => void;
  onBack: () => void;
  isRecording: boolean;
  setIsRecording: (val: boolean) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  showQuickReplies: boolean;
  setShowQuickReplies: (val: boolean) => void;
  onQuickReply: (reply: string) => void;
  onShareLocation: () => void;
  showChatOptions: boolean;
  setShowChatOptions: (val: boolean) => void;
  isMuted: boolean;
  setIsMuted: (val: boolean) => void;
  isTyping: boolean;
}) {
  return (
    <>
      {/* Chat header */}
      <div className="sticky top-14 bg-card/95 backdrop-blur-lg border-b border-border z-40">
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="shrink-0"
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-primary text-primary-foreground">
              أ
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="font-medium">أحمد</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {isTyping ? (
                <span className="text-primary">يكتب...</span>
              ) : (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span>متصل الآن</span>
                </>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary"
            onClick={onShareLocation}
          >
            <Navigation className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-primary">
            <Phone className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowChatOptions(true)}
          >
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-[calc(100vh-320px)]">
        {/* Date separator */}
        <div className="flex items-center justify-center">
          <span className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
            اليوم
          </span>
        </div>

        {messages.map((msg, index) => (
          <div
            key={msg.id}
            className={cn(
              "flex",
              msg.sender === "me" ? "justify-start" : "justify-end",
              "animate-in slide-in-from-bottom-2 duration-200"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2",
                msg.sender === "me"
                  ? "bg-gradient-to-l from-primary to-teal-dark text-white rounded-tr-none"
                  : "bg-secondary rounded-tl-none"
              )}
            >
              {msg.hasLocationShare && (
                <div className="mb-2 p-2 bg-white/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">موقعي الحالي</span>
                  </div>
                  <div className="text-xs opacity-70 mt-1">اضغط للتتبع</div>
                </div>
              )}
              <p>{msg.text}</p>
              <div className="flex items-center justify-end gap-1 mt-1">
                <span
                  className={cn(
                    "text-xs",
                    msg.sender === "me"
                      ? "text-white/70"
                      : "text-muted-foreground"
                  )}
                >
                  {msg.time}
                </span>
                {msg.sender === "me" && (
                  msg.status === "read" ? (
                    <CheckCheck className="w-3 h-3 text-blue-300" />
                  ) : msg.status === "delivered" ? (
                    <CheckCheck className="w-3 h-3" />
                  ) : (
                    <Check className="w-3 h-3" />
                  )
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-end animate-in slide-in-from-bottom-2">
            <div className="bg-secondary rounded-2xl rounded-tl-none px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies */}
      {showQuickReplies && (
        <div className="px-4 pb-2 animate-in slide-in-from-bottom duration-200">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide py-2">
            {QUICK_REPLIES.map((reply) => (
              <button
                key={reply}
                onClick={() => onQuickReply(reply)}
                className="px-4 py-2 rounded-full border-2 border-primary text-primary text-sm whitespace-nowrap hover:bg-primary hover:text-white transition-all shrink-0"
              >
                {reply}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="fixed bottom-20 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border p-4">
        <div className="flex items-center gap-2 max-w-md mx-auto">
          {/* Attachment */}
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground"
          >
            <Paperclip className="w-5 h-5" />
          </Button>

          {/* Quick replies toggle */}
          <Button
            variant="ghost"
            size="icon"
            className={cn("shrink-0", showQuickReplies ? "text-primary" : "text-muted-foreground")}
            onClick={() => setShowQuickReplies(!showQuickReplies)}
          >
            <Smile className="w-5 h-5" />
          </Button>

          {/* Voice recording */}
          <Button
            variant={isRecording ? "destructive" : "ghost"}
            size="icon"
            className="shrink-0 rounded-full"
            onClick={() => setIsRecording(!isRecording)}
          >
            {isRecording ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </Button>

          {/* Text input */}
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="اكتب رسالتك..."
            className="flex-1 rounded-full bg-secondary border-0 pr-4"
            onKeyDown={(e) => e.key === "Enter" && onSendMessage()}
          />

          {/* Send button */}
          <Button
            onClick={onSendMessage}
            className="shrink-0 rounded-full bg-primary"
            size="icon"
            disabled={!message.trim()}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-1 mt-2 text-xs text-muted-foreground">
          <Shield className="w-3 h-3" />
          <span>مشفر باستخدام AES-256</span>
        </div>
      </div>

      {/* Chat Options Dialog */}
      <Dialog open={showChatOptions} onOpenChange={setShowChatOptions}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">خيارات المحادثة</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <button
              onClick={() => {
                setIsMuted(!isMuted);
                toast.success(isMuted ? "تم تفعيل الإشعارات" : "تم كتم الإشعارات");
              }}
              className="w-full p-4 rounded-xl border-2 border-border hover:border-primary transition-all flex items-center gap-3"
            >
              {isMuted ? (
                <Bell className="w-5 h-5 text-primary" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
              <span>{isMuted ? "تفعيل الإشعارات" : "كتم الإشعارات"}</span>
            </button>
            <button
              className="w-full p-4 rounded-xl border-2 border-border hover:border-primary transition-all flex items-center gap-3"
            >
              <Star className="w-5 h-5" />
              <span>إضافة للمفضلة</span>
            </button>
            <button
              className="w-full p-4 rounded-xl border-2 border-border hover:border-primary transition-all flex items-center gap-3"
            >
              <Archive className="w-5 h-5" />
              <span>أرشفة المحادثة</span>
            </button>
            <button
              className="w-full p-4 rounded-xl border-2 border-destructive/50 hover:border-destructive transition-all flex items-center gap-3 text-destructive"
            >
              <Trash2 className="w-5 h-5" />
              <span>حذف المحادثة</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
