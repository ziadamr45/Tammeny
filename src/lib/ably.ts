import Ably from 'ably';
import { getCurrentUser } from './auth';

// Ably client for server-side operations
let ablyServer: Ably.Rest | null = null;

export function getAblyServer(): Ably.Rest {
  if (!ablyServer) {
    const apiKey = process.env.ABLY_API_KEY;
    if (!apiKey) {
      throw new Error('ABLY_API_KEY is not defined');
    }
    ablyServer = new Ably.Rest({ key: apiKey });
  }
  return ablyServer;
}

// Generate Ably token for client authentication
export async function getAblyTokenRequest(userId: string): Promise<Ably.Types.TokenRequest> {
  const ably = getAblyServer();

  return ably.auth.createTokenRequest({
    clientId: userId,
    capability: {
      // User can publish and subscribe to their own channels
      [`user:${userId}:*`]: ['publish', 'subscribe', 'presence'],
      // User can subscribe to session channels they're part of
      [`session:*`]: ['subscribe', 'presence'],
      // User can publish to sessions they created
      [`session:${userId}:*`]: ['publish', 'subscribe', 'presence'],
      // Chat channels
      [`chat:*`]: ['publish', 'subscribe', 'presence'],
      // Location sharing channels
      [`location:*`]: ['publish', 'subscribe'],
    },
    ttl: 60 * 60 * 1000, // 1 hour
  });
}

// Channel names utilities
export const AblyChannels = {
  // User's personal channel for notifications
  userChannel: (userId: string) => `user:${userId}:notifications`,

  // Session channel for location sharing
  sessionChannel: (sessionId: string) => `session:${sessionId}`,

  // Chat channel for messaging
  chatChannel: (sessionId: string) => `chat:${sessionId}`,

  // Location updates channel
  locationChannel: (sessionId: string) => `location:${sessionId}`,

  // Group channel
  groupChannel: (groupId: string) => `group:${groupId}`,
};

// Message types
export interface LocationMessage {
  type: 'location';
  lat: number;
  lng: number;
  accuracy?: number;
  speed?: number;
  timestamp: number;
  battery?: number;
}

export interface ChatMessage {
  type: 'chat';
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
}

export interface NotificationMessage {
  type: 'notification';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: number;
}
