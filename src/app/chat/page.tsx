"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Phone,
  Mic,
  MicOff,
  ArrowRight,
  MoreVertical,
  Search,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BottomNav, Header } from "@/components/tamenny/bottom-nav";

// Mock chat data
const MOCK_CHATS = [
  {
    id: "1",
    name: "أحمد",
    lastMessage: "وصلت السلامة 👍",
    time: "منذ ٥ دقائق",
    unread: 2,
    online: true,
  },
  {
    id: "2",
    name: "محمد",
    lastMessage: "طيب، انتظرك",
    time: "منذ ساعة",
    unread: 0,
    online: false,
  },
  {
    id: "3",
    name: "سارة",
    lastMessage: "شكراً على التتبع",
    time: "أمس",
    unread: 0,
    online: true,
  },
];

const MOCK_MESSAGES = [
  {
    id: "1",
    sender: "them",
    text: "السلام عليكم، وينك دلوقتي؟",
    time: "١٠:٣٠ ص",
  },
  {
    id: "2",
    sender: "me",
    text: "وعليكم السلام، أنا في الطريق",
    time: "١٠:٣١ ص",
  },
  {
    id: "3",
    sender: "them",
    text: "طيب، فين بالظبط؟",
    time: "١٠:٣٢ ص",
  },
  {
    id: "4",
    sender: "me",
    text: "شارك موقعي معاك، تابع من الرابط 👇",
    time: "١٠:٣٣ ص",
  },
  {
    id: "5",
    sender: "them",
    text: "تمام، شايفك 👍",
    time: "١٠:٣٥ ص",
  },
  {
    id: "6",
    sender: "them",
    text: "وصلت السلامة 👍",
    time: "١٠:٤٥ ص",
  },
];

export default function ChatPage() {
  const [view, setView] = useState<"list" | "chat">("list");
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, []);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    // In production, send to backend
    setMessage("");
    scrollToBottom();
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
        <ChatList chats={MOCK_CHATS} onSelectChat={handleSelectChat} />
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
        />
      )}

      <BottomNav />
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
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="بحث في المحادثات..."
          className="pr-10 rounded-xl bg-secondary border-0"
        />
      </div>

      {/* Chat list */}
      <div className="space-y-2">
        {chats.map((chat) => (
          <Card
            key={chat.id}
            className="p-4 card-shadow cursor-pointer hover:shadow-lg transition-shadow"
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
                  <div className="absolute bottom-0 left-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{chat.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {chat.time}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground truncate">
                    {chat.lastMessage}
                  </p>
                  {chat.unread > 0 && (
                    <Badge className="bg-primary text-primary-foreground rounded-full px-2">
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
}: {
  messages: typeof MOCK_MESSAGES;
  message: string;
  setMessage: (msg: string) => void;
  onSendMessage: () => void;
  onBack: () => void;
  isRecording: boolean;
  setIsRecording: (val: boolean) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <>
      {/* Chat header */}
      <div className="sticky top-14 bg-card border-b border-border z-40">
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
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>متصل الآن</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-primary">
            <Phone className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-[calc(100vh-280px)]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex",
              msg.sender === "me" ? "justify-start" : "justify-end"
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2",
                msg.sender === "me"
                  ? "bg-primary text-primary-foreground rounded-tr-none"
                  : "bg-secondary rounded-tl-none"
              )}
            >
              <p>{msg.text}</p>
              <span
                className={cn(
                  "text-xs block mt-1",
                  msg.sender === "me"
                    ? "text-primary-foreground/70"
                    : "text-muted-foreground"
                )}
              >
                {msg.time}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="fixed bottom-20 left-0 right-0 bg-card border-t border-border p-4">
        <div className="flex items-center gap-2 max-w-md mx-auto">
          <Button
            variant={isRecording ? "destructive" : "outline"}
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
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="اكتب رسالتك..."
            className="flex-1 rounded-full bg-secondary border-0 pr-4"
            onKeyDown={(e) => e.key === "Enter" && onSendMessage()}
          />
          <Button
            onClick={onSendMessage}
            className="shrink-0 rounded-full bg-primary"
            size="icon"
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
    </>
  );
}
