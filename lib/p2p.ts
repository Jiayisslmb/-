// @ts-nocheck — libp2p types are incompatible with strict TypeScript
// (Uint8Array<ArrayBufferLike> vs BufferSource, Uint8ArrayList, it-pipe generics)
import {
  createLibp2p,
  Libp2p
} from 'libp2p';
import { webSockets } from '@libp2p/websockets';
import { noise } from '@chainsafe/libp2p-noise';
import { kadDHT } from '@libp2p/kad-dht';
import { identify } from '@libp2p/identify';
import { ping } from '@libp2p/ping';
import { pipe } from 'it-pipe';
import type { Stream, Connection } from '@libp2p/interface';
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string';
import { toString as uint8ArrayToString } from 'uint8arrays/to-string';

export interface P2PMessage {
  id: string;
  from: string;
  to: string;
  type: 'message' | 'notification' | 'sync' | 'ack' | 'heartbeat';
  content: string;
  timestamp: number;
  encrypted: boolean;
  signature?: string;
}

export interface P2PConfig {
  enableDHT: boolean;
  enableEncryption: boolean;
  heartbeatInterval: number;
  connectionTimeout: number;
  maxRetries: number;
  retryDelay: number;
}

export interface PeerInfo {
  id: string;
  addresses: string[];
  lastSeen: number;
  isOnline: boolean;
}

function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function uint8ArrayToHex(arr: Uint8Array): string {
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

async function importAesKey(rawKey: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    rawKey,
    'AES-GCM',
    false,
    ['encrypt', 'decrypt']
  );
}

async function importHmacKey(rawKey: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

const CHAT_PROTOCOL = '/desocial/chat/1.0.0';
const DEFAULT_CONFIG: P2PConfig = {
  enableDHT: true,
  enableEncryption: true,
  heartbeatInterval: 30000,
  connectionTimeout: 10000,
  maxRetries: 3,
  retryDelay: 1000,
};

interface DHTService {
  put(key: Uint8Array, value: Uint8Array): Promise<void>;
  get(key: Uint8Array): Promise<Uint8Array | null>;
}

export class P2PManager {
  private static instance: P2PManager;
  private libp2p: Libp2p | null = null;
  private messages: Map<string, P2PMessage[]> = new Map();
  private listeners: Map<string, ((msg: P2PMessage) => void)[]> = new Map();
  private pendingMessages: Map<string, P2PMessage[]> = new Map();
  private connectionStatus: Map<string, 'connected' | 'connecting' | 'disconnected'> = new Map();
  private peers: Map<string, PeerInfo> = new Map();
  private rawKey: Uint8Array | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private config: P2PConfig;
  private isInitialized: boolean = false;
  private messageQueue: P2PMessage[] = [];
  private processingQueue: boolean = false;

  private constructor(config: Partial<P2PConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  public static getInstance(config?: Partial<P2PConfig>): P2PManager {
    if (!P2PManager.instance) {
      P2PManager.instance = new P2PManager(config);
    }
    return P2PManager.instance;
  }

  async init(): Promise<string | null> {
    if (this.isInitialized) {
      return this.libp2p?.peerId.toString() || null;
    }

    try {
      console.log('正在初始化P2P节点...');

      const isBrowser = typeof window !== 'undefined';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const services: Record<string, any> = {
        identify: identify(),
        ping: ping(),
      };

      if (this.config.enableDHT) {
        services.dht = kadDHT({
          clientMode: isBrowser,
        });
      }

      this.libp2p = await createLibp2p({
        addresses: isBrowser
          ? {}
          : { listen: ['/ip4/0.0.0.0/tcp/0/ws'] },
        transports: [webSockets()],
        connectionEncrypters: [noise()],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        services: services as any,
      });

      this.setupEventListeners();
      await this.libp2p.start();

      if (this.config.enableEncryption) {
        this.rawKey = new Uint8Array(32);
        crypto.getRandomValues(this.rawKey);
      }

      this.startHeartbeat();
      this.isInitialized = true;

      const peerId = this.libp2p.peerId.toString();
      console.log(`P2P节点初始化成功，Peer ID: ${peerId}`);

      const multiaddrs = this.libp2p.getMultiaddrs();
      console.log('监听地址:', multiaddrs.map(m => m.toString()).join(', '));

      return peerId;
    } catch (error) {
      console.error('P2P节点初始化失败:', error);
      this.isInitialized = false;
      return null;
    }
  }

  private setupEventListeners(): void {
    if (!this.libp2p) return;

    this.libp2p.addEventListener('peer:discovery', (event) => {
      const peerId = event.detail.id.toString();
      console.log('发现新节点:', peerId);
      this.connectionStatus.set(peerId, 'disconnected');

      this.peers.set(peerId, {
        id: peerId,
        addresses: [],
        lastSeen: Date.now(),
        isOnline: false,
      });
    });

    this.libp2p.addEventListener('peer:connect', (event) => {
      const peerId = event.detail.toString();
      console.log('连接到节点:', peerId);
      this.connectionStatus.set(peerId, 'connected');

      const peerInfo = this.peers.get(peerId);
      if (peerInfo) {
        peerInfo.isOnline = true;
        peerInfo.lastSeen = Date.now();
      }

      this.sendPendingMessages(peerId);
    });

    this.libp2p.addEventListener('peer:disconnect', (event) => {
      const peerId = event.detail.toString();
      console.log('与节点断开连接:', peerId);
      this.connectionStatus.set(peerId, 'disconnected');

      const peerInfo = this.peers.get(peerId);
      if (peerInfo) {
        peerInfo.isOnline = false;
      }
    });

    this.libp2p.handle(CHAT_PROTOCOL, async (data: { stream: Stream; connection: Connection }) => {
      const stream = data.stream;
      const connection = data.connection;
      const remotePeer = connection.remotePeer.toString();

      try {
        await pipe(
          stream,
          async function* (source: AsyncIterable<Uint8Array>) {
            for await (const data of source) {
              const messageStr = uint8ArrayToString(data.subarray());
              try {
                const message: P2PMessage = JSON.parse(messageStr);
                yield message;
              } catch (e) {
                console.error('解析消息失败:', e);
              }
            }
          },
          async function* (source: AsyncIterable<Uint8Array>) {
            for await (const message of source) {
              await this.handleIncomingMessage(message as P2PMessage, remotePeer);
              const ack = this.createAckMessage((message as P2PMessage).id);
              yield uint8ArrayFromString(JSON.stringify(ack));
            }
          }.bind(this),
          stream
        );
      } catch (error) {
        console.error('处理消息流失败:', error);
      }
    });
  }

  private async handleIncomingMessage(message: P2PMessage, fromPeer: string): Promise<void> {
    let processedMessage = message;

    if (message.encrypted && this.rawKey) {
      try {
        processedMessage = await this.decryptMessage(message);
      } catch (error) {
        console.error('解密消息失败:', error);
        return;
      }
    }

    if (message.type === 'heartbeat') {
      const peerInfo = this.peers.get(fromPeer);
      if (peerInfo) {
        peerInfo.lastSeen = Date.now();
        peerInfo.isOnline = true;
      }
      return;
    }

    const conversationKey = this.getConversationKey(message.from, message.to);
    if (!this.messages.has(conversationKey)) {
      this.messages.set(conversationKey, []);
    }
    this.messages.get(conversationKey)!.push(processedMessage);

    const listeners = this.listeners.get(message.type) || [];
    listeners.forEach(callback => callback(processedMessage));

    console.log(`收到消息 [${message.type}] 来自 ${fromPeer}`);
  }

  async sendMessage(toPeerId: string, content: string, type: P2PMessage['type'] = 'message'): Promise<boolean> {
    if (!this.libp2p || !this.isInitialized) {
      console.warn('P2P节点未初始化，消息将加入队列');
      this.queueMessage(toPeerId, content, type);
      return false;
    }

    const message: P2PMessage = {
      id: globalThis.crypto.randomUUID(),
      from: this.libp2p.peerId.toString(),
      to: toPeerId,
      type,
      content,
      timestamp: Date.now(),
      encrypted: this.config.enableEncryption,
    };

    if (this.config.enableEncryption && this.rawKey) {
      message.content = await this.encryptContent(content);
      message.signature = await this.signMessage(message);
    }

    const connectionStatus = this.connectionStatus.get(toPeerId);
    if (connectionStatus !== 'connected') {
      console.log(`节点 ${toPeerId} 未连接，消息加入待发送队列`);
      this.addToPendingMessages(toPeerId, message);
      return false;
    }

    try {
      const connections = this.libp2p.getConnections(toPeerId);
      if (connections.length === 0) {
        this.addToPendingMessages(toPeerId, message);
        return false;
      }

      const stream = await this.libp2p.dialProtocol(connections[0].remoteAddr, CHAT_PROTOCOL);

      await pipe(
        [uint8ArrayFromString(JSON.stringify(message))],
        stream,
        async function* (source: AsyncIterable<Uint8Array>) {
          for await (const data of source) {
            yield uint8ArrayToString(data.subarray());
          }
        }
      );

      console.log(`消息发送成功 -> ${toPeerId}`);
      return true;
    } catch (error) {
      console.error('发送消息失败:', error);
      this.addToPendingMessages(toPeerId, message);
      return false;
    }
  }

  private async sendPendingMessages(peerId: string): Promise<void> {
    const pending = this.pendingMessages.get(peerId);
    if (!pending || pending.length === 0) return;

    console.log(`发送 ${pending.length} 条待处理消息到 ${peerId}`);

    const failed: P2PMessage[] = [];
    for (const message of pending) {
      const success = await this.sendMessage(peerId, message.content, message.type);
      if (!success) {
        failed.push(message);
      }
    }

    if (failed.length > 0) {
      this.pendingMessages.set(peerId, failed);
    } else {
      this.pendingMessages.delete(peerId);
    }
  }

  private addToPendingMessages(peerId: string, message: P2PMessage): void {
    if (!this.pendingMessages.has(peerId)) {
      this.pendingMessages.set(peerId, []);
    }
    this.pendingMessages.get(peerId)!.push(message);
  }

  private queueMessage(toPeerId: string, content: string, type: P2PMessage['type']): void {
    this.messageQueue.push({
      id: globalThis.crypto.randomUUID(),
      from: '',
      to: toPeerId,
      type,
      content,
      timestamp: Date.now(),
      encrypted: false,
    });
  }

  private createAckMessage(originalId: string): P2PMessage {
    return {
      id: globalThis.crypto.randomUUID(),
      from: this.libp2p?.peerId.toString() || '',
      to: '',
      type: 'ack',
      content: originalId,
      timestamp: Date.now(),
      encrypted: false,
    };
  }

  private async encryptContent(content: string): Promise<string> {
    if (!this.rawKey) return content;

    const iv = new Uint8Array(12);
    crypto.getRandomValues(iv);

    const cryptoKey = await importAesKey(this.rawKey);
    const data = stringToUint8Array(content);
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv, tagLength: 128 },
      cryptoKey,
      data
    );

    return JSON.stringify({
      iv: uint8ArrayToHex(iv),
      data: uint8ArrayToHex(new Uint8Array(encrypted)),
    });
  }

  private async decryptMessage(message: P2PMessage): Promise<P2PMessage> {
    if (!this.rawKey) return message;

    const encrypted = JSON.parse(message.content);
    const iv = hexToUint8Array(encrypted.iv);
    const ciphertext = hexToUint8Array(encrypted.data);

    const cryptoKey = await importAesKey(this.rawKey);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv, tagLength: 128 },
      cryptoKey,
      ciphertext
    );

    return {
      ...message,
      content: new TextDecoder().decode(decrypted),
      encrypted: false,
    };
  }

  private async signMessage(message: P2PMessage): Promise<string> {
    if (!this.rawKey) return '';

    const data = stringToUint8Array(
      `${message.id}${message.from}${message.to}${message.timestamp}`
    );
    const cryptoKey = await importHmacKey(this.rawKey);
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
    return uint8ArrayToHex(new Uint8Array(signature));
  }

  async verifyMessage(message: P2PMessage): Promise<boolean> {
    if (!message.signature || !this.rawKey) return true;

    const data = stringToUint8Array(
      `${message.id}${message.from}${message.to}${message.timestamp}`
    );
    const cryptoKey = await importHmacKey(this.rawKey);
    const expectedSignature = await crypto.subtle.sign('HMAC', cryptoKey, data);
    const expectedHex = uint8ArrayToHex(new Uint8Array(expectedSignature));

    return message.signature === expectedHex;
  }

  private getConversationKey(peer1: string, peer2: string): string {
    return [peer1, peer2].sort().join(':');
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
      this.checkPeerStatus();
    }, this.config.heartbeatInterval);
  }

  private async sendHeartbeat(): Promise<void> {
    if (!this.libp2p) return;

    const connections = this.libp2p.getConnections();
    for (const conn of connections) {
      try {
        await this.sendMessage(conn.remotePeer.toString(), '', 'heartbeat');
      } catch (error) {
        console.debug('心跳发送失败:', error);
      }
    }
  }

  private checkPeerStatus(): void {
    const now = Date.now();
    const timeout = this.config.heartbeatInterval * 3;

    for (const [peerId, peerInfo] of this.peers) {
      if (now - peerInfo.lastSeen > timeout) {
        peerInfo.isOnline = false;
        this.connectionStatus.set(peerId, 'disconnected');
      }
    }
  }

  onMessage(type: P2PMessage['type'], callback: (msg: P2PMessage) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(callback);

    return () => {
      const listeners = this.listeners.get(type);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index !== -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  getMessages(peerId: string): P2PMessage[] {
    const conversationKey = this.getConversationKey(this.libp2p?.peerId.toString() || '', peerId);
    return this.messages.get(conversationKey) || [];
  }

  getPeerInfo(peerId: string): PeerInfo | undefined {
    return this.peers.get(peerId);
  }

  getConnectedPeers(): PeerInfo[] {
    return Array.from(this.peers.values()).filter(p => p.isOnline);
  }

  getConnectionStatus(peerId: string): 'connected' | 'connecting' | 'disconnected' {
    return this.connectionStatus.get(peerId) || 'disconnected';
  }

  async connectToPeer(peerMultiaddr: string): Promise<boolean> {
    if (!this.libp2p) return false;

    try {
      console.log(`正在连接到节点: ${peerMultiaddr}`);
      await this.libp2p.dial(peerMultiaddr);
      return true;
    } catch (error) {
      console.error('连接节点失败:', error);
      return false;
    }
  }

  async discoverPeers(): Promise<string[]> {
    if (!this.libp2p || !this.config.enableDHT) {
      return [];
    }

    try {
      const peers: string[] = [];
      for await (const peer of this.libp2p.peerStore.all()) {
        peers.push(peer.id.toString());
      }
      return peers;
    } catch (error) {
      console.error('发现节点失败:', error);
      return [];
    }
  }

  async publishToDHT(key: string, value: string): Promise<boolean> {
    if (!this.libp2p || !this.config.enableDHT) {
      console.warn('DHT未启用');
      return false;
    }

    try {
      const services = (this.libp2p as unknown as { services: { dht?: DHTService } }).services;
      const dht = services?.dht;
      if (!dht) {
        console.warn('DHT服务不可用');
        return false;
      }

      await dht.put(
        uint8ArrayFromString(key),
        uint8ArrayFromString(value)
      );
      return true;
    } catch (error) {
      console.error('发布到DHT失败:', error);
      return false;
    }
  }

  async getFromDHT(key: string): Promise<string | null> {
    if (!this.libp2p || !this.config.enableDHT) {
      return null;
    }

    try {
      const services = (this.libp2p as unknown as { services: { dht?: DHTService } }).services;
      const dht = services?.dht;
      if (!dht) return null;

      const result = await dht.get(uint8ArrayFromString(key));
      return result ? uint8ArrayToString(result) : null;
    } catch (error) {
      console.error('从DHT获取失败:', error);
      return null;
    }
  }

  async stop(): Promise<void> {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    if (this.libp2p) {
      await this.libp2p.stop();
      this.libp2p = null;
    }

    this.isInitialized = false;
    console.log('P2P节点已停止');
  }

  isReady(): boolean {
    return this.isInitialized && this.libp2p !== null;
  }

  getPeerId(): string | null {
    return this.libp2p?.peerId.toString() || null;
  }

  getMultiaddrs(): string[] {
    if (!this.libp2p) return [];
    return this.libp2p.getMultiaddrs().map(m => m.toString());
  }
}

export const p2pManager = P2PManager.getInstance();
