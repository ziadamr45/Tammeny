import { Server } from "socket.io";

const PORT = 3003;

const io = new Server(PORT, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Store active sessions and their viewers
const sessions = new Map<string, Set<string>>();

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Join a session room (for both creator and viewers)
  socket.on("join-session", (data: { sessionId: string; role: "creator" | "viewer" }) => {
    const { sessionId, role } = data;
    
    socket.join(`session:${sessionId}`);
    
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, new Set());
    }
    sessions.get(sessionId)?.add(socket.id);
    
    console.log(`${role} joined session ${sessionId}`);
    
    // Notify others in the room
    socket.to(`session:${sessionId}`).emit("user-joined", {
      role,
      timestamp: new Date(),
    });
  });

  // Leave a session room
  socket.on("leave-session", (data: { sessionId: string }) => {
    const { sessionId } = data;
    
    socket.leave(`session:${sessionId}`);
    sessions.get(sessionId)?.delete(socket.id);
    
    if (sessions.get(sessionId)?.size === 0) {
      sessions.delete(sessionId);
    }
    
    console.log(`Client left session ${sessionId}`);
  });

  // Location update from creator
  socket.on("location-update", (data: {
    sessionId: string;
    lat: number;
    lng: number;
    speed?: number;
    accuracy?: number;
  }) => {
    const { sessionId, lat, lng, speed, accuracy } = data;
    
    // Broadcast to all viewers in the session
    io.to(`session:${sessionId}`).emit("location", {
      lat,
      lng,
      speed,
      accuracy,
      timestamp: new Date(),
    });
  });

  // ETA update
  socket.on("eta-update", (data: { sessionId: string; eta: number; distance: number }) => {
    io.to(`session:${data.sessionId}`).emit("eta", data);
  });

  // Status update (arrived, nearby, etc.)
  socket.on("status-update", (data: { sessionId: string; status: string }) => {
    io.to(`session:${data.sessionId}`).emit("status", data);
  });

  // Chat message
  socket.on("chat-message", (data: {
    sessionId: string;
    senderId: string;
    senderName: string;
    message: string;
  }) => {
    io.to(`session:${data.sessionId}`).emit("message", {
      ...data,
      timestamp: new Date(),
    });
  });

  // Voice chat signaling
  socket.on("voice-offer", (data: { sessionId: string; offer: RTCSessionDescriptionInit; from: string }) => {
    socket.to(`session:${data.sessionId}`).emit("voice-offer", data);
  });

  socket.on("voice-answer", (data: { sessionId: string; answer: RTCSessionDescriptionInit; from: string }) => {
    socket.to(`session:${data.sessionId}`).emit("voice-answer", data);
  });

  socket.on("voice-ice-candidate", (data: { sessionId: string; candidate: RTCIceCandidateInit; from: string }) => {
    socket.to(`session:${data.sessionId}`).emit("voice-ice-candidate", data);
  });

  // End session
  socket.on("end-session", (data: { sessionId: string }) => {
    io.to(`session:${data.sessionId}`).emit("session-ended", {
      sessionId: data.sessionId,
      timestamp: new Date(),
    });
    
    // Clean up
    sessions.delete(data.sessionId);
    const room = io.sockets.adapter.rooms.get(`session:${data.sessionId}`);
    if (room) {
      room.forEach((socketId) => {
        io.sockets.sockets.get(socketId)?.leave(`session:${data.sessionId}`);
      });
    }
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
    
    // Clean up sessions
    sessions.forEach((viewers, sessionId) => {
      if (viewers.has(socket.id)) {
        viewers.delete(socket.id);
        io.to(`session:${sessionId}`).emit("user-left", {
          socketId: socket.id,
          timestamp: new Date(),
        });
      }
    });
  });
});

console.log(`Socket.io server running on port ${PORT}`);
