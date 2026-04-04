"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import Ably from 'ably';
import { AblyChannels, LocationMessage, ChatMessage, NotificationMessage } from '@/lib/ably';

interface UseAblyOptions {
  enabled?: boolean;
}

export function useAbly(options: UseAblyOptions = {}) {
  const { enabled = true } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<Ably.Realtime | null>(null);
  const channelsRef = useRef<Map<string, any>>(new Map());

  // Initialize Ably client
  useEffect(() => {
    if (!enabled) return;

    let mounted = true;

    async function initAbly() {
      try {
        const response = await fetch('/api/ably/token');
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to get Ably token');
        }

        if (!mounted) return;

        const client = new Ably.Realtime({
          authCallback: (_, callback) => {
            callback(null, data.tokenRequest);
          },
        });

        client.connection.on('connected', () => {
          if (mounted) {
            setIsConnected(true);
            setError(null);
          }
        });

        client.connection.on('failed', (stateChange) => {
          if (mounted) {
            setIsConnected(false);
            setError(stateChange.reason?.message || 'Connection failed');
          }
        });

        clientRef.current = client;
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize Ably');
          setIsConnected(false);
        }
      }
    }

    initAbly();

    return () => {
      mounted = false;
      // Close all channels
      channelsRef.current.forEach((channel) => {
        channel.detach();
      });
      channelsRef.current.clear();
      // Close client
      if (clientRef.current) {
        clientRef.current.close();
        clientRef.current = null;
      }
    };
  }, [enabled]);

  // Subscribe to a channel
  const subscribe = useCallback((
    channelName: string,
    eventName: string,
    callback: (message: any) => void
  ) => {
    if (!clientRef.current) return () => {};

    const channel = clientRef.current.channels.get(channelName);
    channel.subscribe(eventName, callback);
    channelsRef.current.set(channelName, channel);

    return () => {
      channel.unsubscribe(eventName, callback);
    };
  }, []);

  // Publish to a channel
  const publish = useCallback(async (
    channelName: string,
    eventName: string,
    data: unknown
  ) => {
    if (!clientRef.current) {
      throw new Error('Ably client not initialized');
    }

    const channel = clientRef.current.channels.get(channelName);
    await channel.publish(eventName, data);
  }, []);

  // Get channel
  const getChannel = useCallback((channelName: string) => {
    if (!clientRef.current) return null;
    return clientRef.current.channels.get(channelName);
  }, []);

  return {
    isConnected,
    error,
    subscribe,
    publish,
    getChannel,
    channels: AblyChannels,
  };
}

// Hook for location sharing
export function useLocationSharing(sessionId: string | null) {
  const { isConnected, subscribe, publish, channels } = useAbly({ enabled: !!sessionId });
  const [currentLocation, setCurrentLocation] = useState<LocationMessage | null>(null);

  useEffect(() => {
    if (!sessionId || !isConnected) return;

    const channelName = channels.locationChannel(sessionId);
    const unsubscribe = subscribe(channelName, 'update', (message) => {
      setCurrentLocation(message.data as LocationMessage);
    });

    return unsubscribe;
  }, [sessionId, isConnected, subscribe, channels]);

  const sendLocation = useCallback(async (location: Omit<LocationMessage, 'type' | 'timestamp'>) => {
    if (!sessionId) return;

    const message: LocationMessage = {
      type: 'location',
      ...location,
      timestamp: Date.now(),
    };

    await publish(channels.locationChannel(sessionId), 'update', message);
  }, [sessionId, publish, channels]);

  return {
    isConnected,
    currentLocation,
    sendLocation,
  };
}

// Hook for chat
export function useChat(sessionId: string | null) {
  const { isConnected, subscribe, publish, channels } = useAbly({ enabled: !!sessionId });
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!sessionId || !isConnected) return;

    const channelName = channels.chatChannel(sessionId);
    const unsubscribe = subscribe(channelName, 'message', (message) => {
      setMessages((prev) => [...prev, message.data as ChatMessage]);
    });

    return unsubscribe;
  }, [sessionId, isConnected, subscribe, channels]);

  const sendMessage = useCallback(async (
    senderId: string,
    senderName: string,
    content: string
  ) => {
    if (!sessionId) return;

    const message: ChatMessage = {
      type: 'chat',
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      senderId,
      senderName,
      content,
      timestamp: Date.now(),
    };

    await publish(channels.chatChannel(sessionId), 'message', message);
  }, [sessionId, publish, channels]);

  return {
    isConnected,
    messages,
    sendMessage,
  };
}

// Hook for notifications
export function useNotifications(userId: string | null) {
  const { isConnected, subscribe, channels } = useAbly({ enabled: !!userId });
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);

  useEffect(() => {
    if (!userId || !isConnected) return;

    const channelName = channels.userChannel(userId);
    const unsubscribe = subscribe(channelName, 'notification', (message) => {
      setNotifications((prev) => [message.data as NotificationMessage, ...prev]);
    });

    return unsubscribe;
  }, [userId, isConnected, subscribe, channels]);

  return {
    isConnected,
    notifications,
  };
}
