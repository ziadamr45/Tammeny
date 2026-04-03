import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';

const LIVEKIT_URL = process.env.LIVEKIT_URL || '';
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || '';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || '';

// Create LiveKit room service client
export function getRoomServiceClient(): RoomServiceClient | null {
  if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    return null;
  }
  
  return new RoomServiceClient(
    LIVEKIT_URL.replace('wss://', 'https://'),
    LIVEKIT_API_KEY,
    LIVEKIT_API_SECRET
  );
}

// Generate access token for a participant
export function generateLiveKitToken(
  roomName: string,
  participantName: string,
  participantIdentity: string
): string | null {
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    return null;
  }
  
  const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: participantIdentity,
    name: participantName,
  });
  
  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });
  
  return token.toJwt();
}

// Create a room for a session
export async function createSessionRoom(sessionId: string): Promise<boolean> {
  const client = getRoomServiceClient();
  if (!client) return false;
  
  try {
    await client.createRoom({
      name: `session-${sessionId}`,
      emptyTimeout: 60 * 60, // 1 hour timeout
      maxParticipants: 6, // Up to 5 users + 1 buffer
    });
    return true;
  } catch (error) {
    console.error('Failed to create LiveKit room:', error);
    return false;
  }
}

// Delete a room
export async function deleteSessionRoom(sessionId: string): Promise<boolean> {
  const client = getRoomServiceClient();
  if (!client) return false;
  
  try {
    await client.deleteRoom(`session-${sessionId}`);
    return true;
  } catch (error) {
    console.error('Failed to delete LiveKit room:', error);
    return false;
  }
}

// Get LiveKit WebSocket URL
export function getLiveKitUrl(): string {
  return LIVEKIT_URL;
}
