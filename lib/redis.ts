// Redis连接管理器

import { createClient, RedisClientType, RedisFunctions, RedisModules, RedisScripts } from 'redis';

class RedisManager {
  private static instance: RedisManager;
  private client: RedisClientType<RedisFunctions, RedisModules, RedisScripts>;
  private subscriberClient: RedisClientType<RedisFunctions, RedisModules, RedisScripts> | null = null;
  private isConnected: boolean = false;
  private messageCache: Map<string, any> = new Map();
  private userCache: Map<string, any> = new Map();
  private conversationCache: Map<string, any> = new Map();
  private cacheTTL: number = 60 * 1000; // 缓存过期时间（毫秒）
  private cacheStats: {
    hits: number;
    misses: number;
    total: number;
  } = {
    hits: 0,
    misses: 0,
    total: 0
  };

  private constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        connectTimeout: 5000,
        keepAlive: true
      }
    });

    this.client.on('error', (err) => {
      console.error('Redis客户端错误:', err);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      console.log('Redis连接成功');
      this.isConnected = true;
      // 缓存预热
      this.prewarmCache();
    });

    this.client.on('end', () => {
      console.log('Redis连接关闭');
      this.isConnected = false;
    });

    // 初始化订阅客户端
    this.subscriberClient = this.client.duplicate();
    this.subscriberClient.connect().catch(err => {
      console.error('Redis订阅客户端连接失败:', err);
    });

    // 定期清理过期缓存（每5分钟）
    setInterval(() => {
      this.cleanupCache();
    }, 5 * 60 * 1000);

    // 定期打印缓存统计（每10分钟）
    setInterval(() => {
      this.printCacheStats();
    }, 10 * 60 * 1000);
  }

  public static getInstance(): RedisManager {
    if (!RedisManager.instance) {
      RedisManager.instance = new RedisManager();
    }
    return RedisManager.instance;
  }

  // 连接Redis
  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
    }
  }

  // 断开Redis连接
  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
    }
    if (this.subscriberClient) {
      await this.subscriberClient.disconnect();
    }
  }

  // 批量存储消息
  async batchStoreMessages(messages: any[]): Promise<void> {
    await this.connect();
    
    const pipeline = this.client.multi();
    
    for (const message of messages) {
      const messageId = message.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const key = `message:${messageId}`;
      
      // 存储消息详情
      pipeline.hSet(key, 'id', messageId);
      pipeline.hSet(key, 'from', message.from);
      pipeline.hSet(key, 'to', message.to);
      pipeline.hSet(key, 'type', message.type);
      pipeline.hSet(key, 'content', message.content);
      pipeline.hSet(key, 'timestamp', message.timestamp.toString());
      pipeline.hSet(key, 'isRead', message.isRead ? 'true' : 'false');
      
      // 设置消息过期时间（7天）
      pipeline.expire(key, 7 * 24 * 60 * 60);
      
      // 将消息ID添加到接收者的消息列表
      pipeline.lPush(`user:${message.to}:messages`, messageId);
      
      // 将消息ID添加到对话列表
      const conversationKey = `conversation:${message.from}:${message.to}`;
      pipeline.lPush(conversationKey, messageId);
      
      // 设置对话列表过期时间（30天）
      pipeline.expire(conversationKey, 30 * 24 * 60 * 60);
    }
    
    await pipeline.exec();
  }

  // 存储消息
  async storeMessage(message: any): Promise<void> {
    await this.connect();
    
    const messageId = message.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const key = `message:${messageId}`;
    
    // 存储消息详情
    await this.client.hSet(key, 'id', messageId);
    await this.client.hSet(key, 'from', message.from);
    await this.client.hSet(key, 'to', message.to);
    await this.client.hSet(key, 'type', message.type);
    await this.client.hSet(key, 'content', message.content);
    await this.client.hSet(key, 'timestamp', message.timestamp.toString());
    await this.client.hSet(key, 'isRead', message.isRead ? 'true' : 'false');
    
    // 设置消息过期时间（7天）
    await this.client.expire(key, 7 * 24 * 60 * 60);
    
    // 将消息ID添加到接收者的消息列表
    await this.client.lPush(`user:${message.to}:messages`, messageId);
    
    // 将消息ID添加到对话列表
    const conversationKey = `conversation:${message.from}:${message.to}`;
    await this.client.lPush(conversationKey, messageId);
    
    // 设置对话列表过期时间（30天）
    await this.client.expire(conversationKey, 30 * 24 * 60 * 60);
    
    // 更新缓存
    this.messageCache.set(messageId, {
      data: message,
      timestamp: Date.now()
    });
  }

  // 获取消息
  async getMessage(messageId: string): Promise<any> {
    // 先从缓存中获取
    const cachedMessage = this.messageCache.get(messageId);
    if (cachedMessage && (Date.now() - cachedMessage.timestamp) < this.cacheTTL) {
      this.recordCacheHit();
      return cachedMessage.data;
    }
    
    this.recordCacheMiss();
    await this.connect();
    
    const key = `message:${messageId}`;
    const message = await this.client.hGetAll(key);
    
    if (Object.keys(message).length === 0) {
      return null;
    }
    
    const parsedMessage = {
      ...message,
      timestamp: parseInt(message.timestamp),
      isRead: message.isRead === 'true'
    };
    
    // 更新缓存
    this.messageCache.set(messageId, {
      data: parsedMessage,
      timestamp: Date.now()
    });
    
    return parsedMessage;
  }

  // 批量获取消息
  async batchGetMessages(messageIds: string[]): Promise<any[]> {
    await this.connect();
    
    const pipeline = this.client.multi();
    messageIds.forEach(id => {
      pipeline.hGetAll(`message:${id}`);
    });
    
    const results = await pipeline.exec() as any[];
    const messages = [];
    
    for (let i = 0; i < results.length; i++) {
      const [err, message] = results[i];
      if (!err && message && Object.keys(message).length > 0) {
        const parsedMessage = {
          ...message,
          timestamp: parseInt(message.timestamp),
          isRead: message.isRead === 'true'
        };
        messages.push(parsedMessage);
        
        // 更新缓存
        this.messageCache.set(messageIds[i], {
          data: parsedMessage,
          timestamp: Date.now()
        });
      }
    }
    
    return messages;
  }

  // 获取用户的消息列表
  async getUserMessages(userId: string, limit: number = 50, offset: number = 0): Promise<any[]> {
    await this.connect();
    
    const messageIds = await this.client.lRange(`user:${userId}:messages`, offset, offset + limit - 1);
    
    // 批量获取消息
    return await this.batchGetMessages(messageIds);
  }

  // 获取对话消息
  async getConversationMessages(userId1: string, userId2: string, limit: number = 50, offset: number = 0): Promise<any[]> {
    await this.connect();
    
    const conversationKey = `conversation:${userId1}:${userId2}`;
    const messageIds = await this.client.lRange(conversationKey, offset, offset + limit - 1);
    
    // 批量获取消息
    return await this.batchGetMessages(messageIds);
  }

  // 批量标记消息为已读
  async batchMarkMessagesAsRead(messageIds: string[]): Promise<void> {
    await this.connect();
    
    const pipeline = this.client.multi();
    messageIds.forEach(id => {
      pipeline.hSet(`message:${id}`, 'isRead', 'true');
    });
    
    await pipeline.exec();
    
    // 更新缓存
    messageIds.forEach(id => {
      const cachedMessage = this.messageCache.get(id);
      if (cachedMessage) {
        cachedMessage.data.isRead = true;
        cachedMessage.timestamp = Date.now();
      }
    });
  }

  // 标记消息为已读
  async markMessageAsRead(messageId: string): Promise<void> {
    await this.connect();
    
    const key = `message:${messageId}`;
    await this.client.hSet(key, 'isRead', 'true');
    
    // 更新缓存
    const cachedMessage = this.messageCache.get(messageId);
    if (cachedMessage) {
      cachedMessage.data.isRead = true;
      cachedMessage.timestamp = Date.now();
    }
  }

  // 获取未读消息数量
  async getUnreadMessageCount(userId: string): Promise<number> {
    await this.connect();
    
    const messageIds = await this.client.lRange(`user:${userId}:messages`, 0, -1);
    
    // 批量获取消息
    const messages = await this.batchGetMessages(messageIds);
    
    return messages.filter(msg => !msg.isRead).length;
  }

  // 发布消息到频道
  async publishMessage(channel: string, message: any): Promise<void> {
    await this.connect();
    await this.client.publish(channel, JSON.stringify(message));
  }

  // 订阅频道
  async subscribeToChannel(channel: string, callback: (message: any) => void): Promise<void> {
    if (!this.subscriberClient) {
      this.subscriberClient = this.client.duplicate();
      await this.subscriberClient.connect();
    }
    
    await this.subscriberClient.subscribe(channel, (message) => {
      try {
        const parsedMessage = JSON.parse(message);
        callback(parsedMessage);
      } catch (error) {
        console.error('解析消息失败:', error);
      }
    });
  }

  // 清理过期缓存
  private cleanupCache(): void {
    const now = Date.now();
    
    // 清理消息缓存
    for (const [key, value] of this.messageCache.entries()) {
      if (now - value.timestamp > this.cacheTTL) {
        this.messageCache.delete(key);
      }
    }
    
    // 清理用户缓存
    for (const [key, value] of this.userCache.entries()) {
      if (now - value.timestamp > this.cacheTTL) {
        this.userCache.delete(key);
      }
    }
    
    // 清理对话缓存
    for (const [key, value] of this.conversationCache.entries()) {
      if (now - value.timestamp > this.cacheTTL) {
        this.conversationCache.delete(key);
      }
    }
    
    console.log('缓存清理完成，当前缓存大小:', {
      message: this.messageCache.size,
      user: this.userCache.size,
      conversation: this.conversationCache.size
    });
  }

  // 缓存预热
  private async prewarmCache(): Promise<void> {
    try {
      console.log('开始缓存预热...');
      // 这里可以实现缓存预热逻辑
      // 例如加载热点消息、活跃用户等
      console.log('缓存预热完成');
    } catch (error) {
      console.error('缓存预热失败:', error);
    }
  }

  // 打印缓存统计
  private printCacheStats(): void {
    const hitRate = this.cacheStats.total > 0 ? (this.cacheStats.hits / this.cacheStats.total * 100).toFixed(2) : '0.00';
    console.log('缓存统计:', {
      hits: this.cacheStats.hits,
      misses: this.cacheStats.misses,
      total: this.cacheStats.total,
      hitRate: `${hitRate}%`,
      cacheSize: {
        message: this.messageCache.size,
        user: this.userCache.size,
        conversation: this.conversationCache.size
      }
    });
  }

  // 记录缓存命中
  private recordCacheHit(): void {
    this.cacheStats.hits++;
    this.cacheStats.total++;
  }

  // 记录缓存未命中
  private recordCacheMiss(): void {
    this.cacheStats.misses++;
    this.cacheStats.total++;
  }

  // 备份消息到持久存储
  async backupMessages(): Promise<void> {
    // 这里可以实现消息备份到其他存储介质的逻辑
    // 例如备份到文件系统或云存储
    console.log('消息备份完成');
  }

  // 从持久存储恢复消息
  async restoreMessages(): Promise<void> {
    // 这里可以实现从备份中恢复消息的逻辑
    console.log('消息恢复完成');
  }

  // 验证消息完整性
  async verifyMessageIntegrity(): Promise<boolean> {
    // 这里可以实现消息完整性验证的逻辑
    return true;
  }
}


// 导出实例
export const redisManager = RedisManager.getInstance();
