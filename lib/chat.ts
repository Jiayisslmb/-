'use client';

import { io, Socket } from 'socket.io-client';

export interface ChatMessage {
  id: number;
  content: string;
  senderId: number;
  receiverId: number;
  mediaCid?: string;
  createdAt: string;
  isRead: boolean;
  tempId?: string;
  sender: {
    id: number;
    username: string;
    avatarCid?: string;
  };
}

export interface UserStatus {
  userId: number;
  isOnline: boolean;
  timestamp: string;
  lastSeen?: string;
  deviceCount?: number;
}

export interface UserStatusInfo {
  userId: number;
  isOnline: boolean;
  lastSeen?: string;
  deviceCount?: number;
}

export interface TypingIndicator {
  userId: number;
  username: string;
  isTyping: boolean;
}

export interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  lastPing: number;
  reconnectAttempts: number;
}

type MessageCallback = (message: ChatMessage) => void;
type StatusCallback = (status: UserStatus) => void;
type StatusesCallback = (statuses: UserStatusInfo[]) => void;
type TypingCallback = (typing: TypingIndicator) => void;
type ReadCallback = (data: { byUserId: number; senderId: number }) => void;
type ErrorCallback = (error: { message: string; tempId?: string }) => void;
type OnlineUsersCallback = (userIds: number[]) => void;
type ConnectionStateCallback = (state: ConnectionState) => void;

class ChatClient {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private heartbeatInterval: number = 30000;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private lastPing: number = 0;
  private currentToken: string | null = null;
  private tokenRefreshing: boolean = false;
  private connectionState: ConnectionState = {
    isConnected: false,
    isConnecting: false,
    lastPing: 0,
    reconnectAttempts: 0,
  };
  
  private messageCallbacks: Set<MessageCallback> = new Set();
  private statusCallbacks: Set<StatusCallback> = new Set();
  private statusesCallbacks: Set<StatusesCallback> = new Set();
  private typingCallbacks: Set<TypingCallback> = new Set();
  private readCallbacks: Set<ReadCallback> = new Set();
  private errorCallbacks: Set<ErrorCallback> = new Set();
  private sentCallbacks: Set<MessageCallback> = new Set();
  private connectedCallbacks: Set<(data: { userId: number; username: string; unreadCount: number; onlineUsers: number[] }) => void> = new Set();
  private onlineUsersCallbacks: Set<OnlineUsersCallback> = new Set();
  private connectionStateCallbacks: Set<ConnectionStateCallback> = new Set();
  private joinedConversationCallbacks: Set<(data: { otherUserId: number; otherUserOnline: boolean; otherUserLastSeen?: string }) => void> = new Set();
  
  private onlineUsers: Set<number> = new Set();
  private userStatuses: Map<number, UserStatusInfo> = new Map();

  // Promise-based connection queue to avoid setInterval polling race conditions
  private connectionPromise: Promise<{ userId: number; username: string; unreadCount: number; onlineUsers: number[] }> | null = null;
  private connectionResolver: ((value: { userId: number; username: string; unreadCount: number; onlineUsers: number[] }) => void) | null = null;
  private connectionRejecter: ((reason: Error) => void) | null = null;

  // 动态获取当前 Token（支持过期后自动刷新）
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  // 外部调用：更新 Token（Token 刷新后同步）
  updateToken(newToken: string): void {
    this.currentToken = newToken;
    // 如果当前已连接，更新 socket auth 中的 token
    if (this.socket && 'auth' in this.socket) {
      (this.socket as any).auth = { token: newToken };
    }
  }

  connect(token?: string): Promise<{ userId: number; username: string; unreadCount: number; onlineUsers: number[] }> {
    const activeToken = token || this.getToken();
    if (!activeToken) {
      return Promise.reject(new Error('未登录，无法连接'));
    }
    this.currentToken = activeToken;

    if (this.socket?.connected) {
      return Promise.resolve({ userId: 0, username: '', unreadCount: 0, onlineUsers: Array.from(this.onlineUsers) });
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      this.connectionResolver = resolve;
      this.connectionRejecter = reject;

      this.isConnecting = true;
      this.updateConnectionState();

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';
      const isRelative = apiUrl.startsWith('/');
      const socketNamespace = '/api/chat';
      const socketUrl = isRelative
        ? `https://api.desocial.top${socketNamespace}`
        : `${apiUrl.replace('/api', '')}${socketNamespace}`;

      try {
        this.socket = io(socketUrl, {
          auth: { token: activeToken },
          path: '/api/socket.io',
          transports: ['polling'],
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectDelay,
          reconnectionDelayMax: 5000,
          randomizationFactor: 0.5,
        });

      this.socket.on('connect', () => {
        console.log('WebSocket 已连接');
        this.isConnected = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.lastPing = Date.now();
        this.flushPendingMessages();
        this.updateConnectionState();
      });

      this.socket.on('connected', (data: { userId: number; username: string; unreadCount: number; onlineUsers: number[]; heartbeatInterval?: number }) => {
        console.log('聊天服务已就绪:', data);
        if (data.onlineUsers) {
          this.onlineUsers = new Set(data.onlineUsers);
        }
        // Sync heartbeat interval from server
        if (data.heartbeatInterval) {
          this.heartbeatInterval = data.heartbeatInterval;
          this.startHeartbeat();
        }
        this.connectedCallbacks.forEach(cb => cb(data));
        this.connectionResolver?.(data);
        this.clearConnectionPromise();
      });

      this.socket.on('disconnect', (reason) => {
        console.log('WebSocket 已断开:', reason);
        this.isConnected = false;
        this.isConnecting = false;
        this.updateConnectionState();
        this.stopHeartbeat();
        
        if (reason === 'io server disconnect') {
          this.socket?.connect();
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket 连接错误:', error);
        this.reconnectAttempts++;
        this.isConnecting = false;
        this.updateConnectionState();

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          this.connectionRejecter?.(new Error('连接失败，请刷新页面重试'));
          this.clearConnectionPromise();
        }
      });

      this.socket.on('reconnect', (attemptNumber) => {
        console.log('WebSocket 重新连接成功，尝试次数:', attemptNumber);
        this.reconnectAttempts = 0;
        this.flushPendingMessages();
        this.updateConnectionState();
      });

      this.socket.on('reconnect_attempt', (attemptNumber) => {
        console.log('WebSocket 重新连接尝试:', attemptNumber);
        this.reconnectAttempts = attemptNumber;
        this.updateConnectionState();
      });

      this.socket.on('new_message', (message: ChatMessage) => {
        console.log('收到新消息:', message);
        this.messageCallbacks.forEach(cb => cb(message));
      });

      this.socket.on('message_sent', (message: ChatMessage) => {
        console.log('消息已发送:', message);
        this.sentCallbacks.forEach(cb => cb(message));
      });

      this.socket.on('user_status', (status: UserStatus) => {
        console.log('用户状态变化:', status);
        this.userStatuses.set(status.userId, {
          userId: status.userId,
          isOnline: status.isOnline,
          lastSeen: status.lastSeen,
        });
        
        if (status.isOnline) {
          this.onlineUsers.add(status.userId);
        } else {
          this.onlineUsers.delete(status.userId);
        }
        
        this.statusCallbacks.forEach(cb => cb(status));
      });

      this.socket.on('user_statuses', (statuses: UserStatusInfo[]) => {
        console.log('批量用户状态:', statuses);
        statuses.forEach(status => {
          this.userStatuses.set(status.userId, status);
          if (status.isOnline) {
            this.onlineUsers.add(status.userId);
          } else {
            this.onlineUsers.delete(status.userId);
          }
        });
        this.statusesCallbacks.forEach(cb => cb(statuses));
      });

      this.socket.on('user_typing', (typing: TypingIndicator) => {
        this.typingCallbacks.forEach(cb => cb(typing));
      });

      this.socket.on('messages_read', (data: { byUserId: number; senderId: number }) => {
        console.log('消息已读:', data);
        this.readCallbacks.forEach(cb => cb(data));
      });

      this.socket.on('online_users_update', (userIds: number[]) => {
        console.log('在线用户更新:', userIds);
        this.onlineUsers = new Set(userIds);
        this.onlineUsersCallbacks.forEach(cb => cb(userIds));
      });

      this.socket.on('joined_conversation', (data: { otherUserId: number; otherUserOnline: boolean; otherUserLastSeen?: string }) => {
        console.log('已加入对话:', data);
        this.joinedConversationCallbacks.forEach(cb => cb(data));
      });

      this.socket.on('heartbeat_ack', (data: { serverTime: number; onlineUsers?: number[] }) => {
        this.lastPing = Date.now();
        if (data.onlineUsers) {
          this.onlineUsers = new Set(data.onlineUsers);
        }
        this.updateConnectionState();
      });

      this.socket.on('error', async (error: any) => {
        console.error('聊天错误:', error);
        const errorData = typeof error === 'object' && error !== null
          ? error
          : { message: String(error) };
        const code = errorData?.code || errorData?.message;

        // AUTH_INVALID: Token 可能已过期，尝试刷新后重连
        if (code === 'AUTH_INVALID' || code === 'AUTH_EXPIRED' || code === '认证令牌无效或已过期') {
          console.log('检测到认证令牌过期，尝试刷新...');
          if (!this.tokenRefreshing) {
            this.tokenRefreshing = true;
            try {
              const newToken = await this.refreshTokenAndGet();
              if (newToken && newToken !== this.currentToken) {
                console.log('Token 已刷新，使用新 Token 重连');
                this.updateToken(newToken);
                // 断开旧连接并用新 Token 重连
                this.socket?.disconnect();
                this.socket = null;
                this.isConnected = false;
                this.isConnecting = false;
                this.clearConnectionPromise();
                this.tokenRefreshing = false;
                // 递归调用 connect 使用新 Token
                setTimeout(() => this.connect(), 1000);
                return;
              }
            } catch (refreshErr) {
              console.error('Token 刷新失败:', refreshErr);
            }
            this.tokenRefreshing = false;
          }
        }

        this.errorCallbacks.forEach(cb => cb(errorData));
      });
      } catch (error) {
        console.error('WebSocket初始化错误:', error);
        this.isConnecting = false;
        this.updateConnectionState();
        this.connectionRejecter?.(new Error('WebSocket连接失败'));
        this.clearConnectionPromise();
      }
    });

    return this.connectionPromise;
  }

  // 尝试通过 REST API 刷新 Token
  private async refreshTokenAndGet(): Promise<string | null> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return null;

      const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api';
      const res = await fetch(`${apiBase}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) return null;
      const data = await res.json();

      if (data.accessToken) {
        localStorage.setItem('token', data.accessToken);
        document.cookie = `token=${data.accessToken}; path=/; max-age=604800; SameSite=Lax`;
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        return data.accessToken;
      }
      return null;
    } catch {
      return null;
    }
  }

  private clearConnectionPromise(): void {
    this.connectionPromise = null;
    this.connectionResolver = null;
    this.connectionRejecter = null;
  }

  disconnect(): void {
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.onlineUsers.clear();
      this.userStatuses.clear();
      this.clearAllCallbacks();
      this.updateConnectionState();
    }
  }

  private clearAllCallbacks(): void {
    this.messageCallbacks.clear();
    this.statusCallbacks.clear();
    this.statusesCallbacks.clear();
    this.typingCallbacks.clear();
    this.readCallbacks.clear();
    this.errorCallbacks.clear();
    this.sentCallbacks.clear();
    this.connectedCallbacks.clear();
    this.onlineUsersCallbacks.clear();
    this.connectionStateCallbacks.clear();
    this.joinedConversationCallbacks.clear();
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('heartbeat', { 
          timestamp: Date.now(),
          active: true,
        });
      }
    }, this.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private updateConnectionState(): void {
    this.connectionState = {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      lastPing: this.lastPing,
      reconnectAttempts: this.reconnectAttempts,
    };
    this.connectionStateCallbacks.forEach(cb => cb(this.connectionState));
  }

  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  getIsConnecting(): boolean {
    return this.isConnecting;
  }

  getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  isUserOnline(userId: number): boolean {
    return this.onlineUsers.has(userId);
  }

  getUserStatus(userId: number): UserStatusInfo | undefined {
    return this.userStatuses.get(userId);
  }

  getOnlineUsers(): number[] {
    return Array.from(this.onlineUsers);
  }

  sendMessage(receiverId: number, content: string, mediaCid?: string): string {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    if (!this.socket?.connected) {
      this.addPendingMessage(receiverId, content, tempId, mediaCid);
      return tempId;
    }

    try {
      this.socket.emit('send_message', {
        receiverId,
        content,
        mediaCid,
        tempId,
      });
    } catch (error) {
      console.error('发送消息失败:', error);
      this.addPendingMessage(receiverId, content, tempId, mediaCid);
    }

    return tempId;
  }

  // Message retry queue
  private pendingMessages: Array<{ receiverId: number; content: string; mediaCid?: string; tempId: string; retries: number }> = [];
  private maxRetries = 3;

  private flushPendingMessages(): void {
    if (!this.socket?.connected) return;

    const messages = [...this.pendingMessages];
    this.pendingMessages = [];

    for (const msg of messages) {
      if (msg.retries >= this.maxRetries) {
        this.errorCallbacks.forEach(cb => cb({ message: '消息发送失败，已达最大重试次数', tempId: msg.tempId }));
        continue;
      }
      try {
        this.socket.emit('send_message', {
          receiverId: msg.receiverId,
          content: msg.content,
          mediaCid: msg.mediaCid,
          tempId: msg.tempId,
        });
      } catch {
        this.pendingMessages.push({ ...msg, retries: msg.retries + 1 });
      }
    }
  }

  private addPendingMessage(receiverId: number, content: string, tempId: string, mediaCid?: string): void {
    this.pendingMessages.push({ receiverId, content, mediaCid, tempId, retries: 0 });
    if (this.pendingMessages.length > 100) {
      this.pendingMessages.shift();
    }
  }

  sendTypingIndicator(receiverId: number, isTyping: boolean): void {
    if (this.socket?.connected) {
      try {
        this.socket.emit('typing', { receiverId, isTyping });
      } catch (error) {
        console.error('发送 typing 状态失败:', error);
      }
    }
  }

  markAsRead(senderId: number): void {
    if (this.socket?.connected) {
      try {
        this.socket.emit('mark_read', { senderId });
      } catch (error) {
        console.error('标记已读失败:', error);
      }
    }
  }

  joinConversation(otherUserId: number): void {
    if (this.socket?.connected) {
      try {
        this.socket.emit('join_conversation', { otherUserId });
      } catch (error) {
        console.error('加入对话失败:', error);
      }
    }
  }

  leaveConversation(otherUserId: number): void {
    if (this.socket?.connected) {
      try {
        this.socket.emit('leave_conversation', { otherUserId });
      } catch (error) {
        console.error('离开对话失败:', error);
      }
    }
  }

  getOnlineUsersList(): void {
    if (this.socket?.connected) {
      try {
        this.socket.emit('get_online_users');
      } catch (error) {
        console.error('获取在线用户列表失败:', error);
      }
    }
  }

  getUserStatusBatch(userIds: number[]): void {
    if (this.socket?.connected) {
      try {
        this.socket.emit('get_user_status', { userIds });
      } catch (error) {
        console.error('获取用户状态失败:', error);
      }
    }
  }

  reconnect(): void {
    if (this.socket && !this.socket.connected) {
      this.socket.connect();
    }
  }

  onMessage(callback: MessageCallback): () => void {
    this.messageCallbacks.add(callback);
    return () => this.messageCallbacks.delete(callback);
  }

  onMessageSent(callback: MessageCallback): () => void {
    this.sentCallbacks.add(callback);
    return () => this.sentCallbacks.delete(callback);
  }

  onUserStatus(callback: StatusCallback): () => void {
    this.statusCallbacks.add(callback);
    return () => this.statusCallbacks.delete(callback);
  }

  onUserStatuses(callback: StatusesCallback): () => void {
    this.statusesCallbacks.add(callback);
    return () => this.statusesCallbacks.delete(callback);
  }

  onTyping(callback: TypingCallback): () => void {
    this.typingCallbacks.add(callback);
    return () => this.typingCallbacks.delete(callback);
  }

  onMessagesRead(callback: ReadCallback): () => void {
    this.readCallbacks.add(callback);
    return () => this.readCallbacks.delete(callback);
  }

  onError(callback: ErrorCallback): () => void {
    this.errorCallbacks.add(callback);
    return () => this.errorCallbacks.delete(callback);
  }

  onConnected(callback: (data: { userId: number; username: string; unreadCount: number; onlineUsers: number[] }) => void): () => void {
    this.connectedCallbacks.add(callback);
    return () => this.connectedCallbacks.delete(callback);
  }

  onOnlineUsersUpdate(callback: OnlineUsersCallback): () => void {
    this.onlineUsersCallbacks.add(callback);
    return () => this.onlineUsersCallbacks.delete(callback);
  }

  onConnectionStateChange(callback: ConnectionStateCallback): () => void {
    this.connectionStateCallbacks.add(callback);
    return () => this.connectionStateCallbacks.delete(callback);
  }

  onJoinedConversation(callback: (data: { otherUserId: number; otherUserOnline: boolean; otherUserLastSeen?: string }) => void): () => void {
    this.joinedConversationCallbacks.add(callback);
    return () => this.joinedConversationCallbacks.delete(callback);
  }
}

export const chatClient = new ChatClient();
