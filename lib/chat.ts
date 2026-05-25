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
  
  private onlineUsers: Set<number> = new Set();
  private userStatuses: Map<number, UserStatusInfo> = new Map();

  connect(token: string): Promise<{ userId: number; username: string; unreadCount: number; onlineUsers: number[] }> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve({ userId: 0, username: '', unreadCount: 0, onlineUsers: Array.from(this.onlineUsers) });
        return;
      }

      if (this.isConnecting) {
        // 等待连接完成而不是拒绝
        const checkConnection = setInterval(() => {
          if (this.socket?.connected) {
            clearInterval(checkConnection);
            resolve({ userId: 0, username: '', unreadCount: 0, onlineUsers: Array.from(this.onlineUsers) });
          } else if (!this.isConnecting) {
            clearInterval(checkConnection);
            reject(new Error('连接失败'));
          }
        }, 100);
        return;
      }

      this.isConnecting = true;
      this.updateConnectionState();

      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
      // 确保WebSocket连接使用ws://协议
      const socketUrl = wsUrl.replace('http://', 'ws://').replace('https://', 'wss://');
      
      try {
        this.socket = io(`${socketUrl}/chat`, {
          auth: { token },
          transports: ['websocket', 'polling'],
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
        this.updateConnectionState();
        this.startHeartbeat();
      });

      this.socket.on('connected', (data: { userId: number; username: string; unreadCount: number; onlineUsers: number[] }) => {
        console.log('聊天服务已就绪:', data);
        if (data.onlineUsers) {
          this.onlineUsers = new Set(data.onlineUsers);
        }
        this.connectedCallbacks.forEach(cb => cb(data));
        resolve(data);
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
          reject(new Error('连接失败，请刷新页面重试'));
        }
      });

      this.socket.on('reconnect', (attemptNumber) => {
        console.log('WebSocket 重新连接成功，尝试次数:', attemptNumber);
        this.reconnectAttempts = 0;
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

      this.socket.on('heartbeat_ack', (data: { serverTime: number; onlineUsers?: number[] }) => {
        this.lastPing = Date.now();
        if (data.onlineUsers) {
          this.onlineUsers = new Set(data.onlineUsers);
        }
        this.updateConnectionState();
      });

      this.socket.on('error', (error: any) => {
        console.error('聊天错误:', error);
        const errorData = typeof error === 'object' && error !== null 
          ? error 
          : { message: String(error) };
        this.errorCallbacks.forEach(cb => cb(errorData));
      });
      } catch (error) {
        console.error('WebSocket初始化错误:', error);
        this.isConnecting = false;
        this.updateConnectionState();
        reject(new Error('WebSocket连接失败'));
      }
    });
  }

  disconnect(): void {
    this.stopHeartbeat();
    if (this.socket) {
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
    if (!this.socket?.connected) {
      throw new Error('WebSocket 未连接');
    }

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      this.socket.emit('send_message', {
        receiverId,
        content,
        mediaCid,
        tempId,
      });
    } catch (error) {
      console.error('发送消息失败:', error);
      throw new Error('发送消息失败');
    }

    return tempId;
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
}

export const chatClient = new ChatClient();
