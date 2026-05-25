'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import LinkWithBack from '@/components/common/LinkWithBack';
import { useAuth } from '@/lib/auth';
import { useOnlineStatus, formatLastSeen } from '@/lib/hooks/useOnlineStatus';
import { chatClient, ChatMessage } from '@/lib/chat';
import { getIPFSUrl } from '@/lib/ipfs';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import BackButton from '@/components/common/BackButton';
import OnlineStatusIndicator from '@/components/common/OnlineStatusIndicator';
import UserDisplay from '@/components/common/UserDisplay';


interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  isRead: boolean;
  sender: {
    id: string;
    username: string;
    avatarCid?: string;
  };
  tempId?: string;
}

interface ChatUser {
  id: string;
  username: string;
  nickname?: string | null;
  avatarCid?: string | null;
  isOnline?: boolean;
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const otherUserId = params.userId as string;
  
  const { isOnline, lastSeen, isLoading: statusLoading } = useOnlineStatus(otherUserId, {
    enabled: !!otherUserId,
    refreshInterval: 15000,
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [chatUser, setChatUser] = useState<ChatUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [pendingMessages, setPendingMessages] = useState<Map<string, Message>>(new Map());
  const [connectionState, setConnectionState] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  const scrollToBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, []);

  const checkIfNearBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    const threshold = 150;
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!currentUser) {
      router.push('/auth/sign-in');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/sign-in');
      return;
    }

    const initializeChat = async () => {
      try {
        setLoading(true);

        const userRes = await fetch(`/api/users/${otherUserId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (userRes.ok) {
          const user = await userRes.json();
          setChatUser(user);
        }

        const messagesRes = await fetch(
          `/api/messages/conversation/${otherUserId}?skip=0&take=50`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (messagesRes.ok) {
          const apiMessages = await messagesRes.json();
          const formattedMessages = apiMessages.map((msg: any) => ({
            ...msg,
            id: String(msg.id),
            senderId: String(msg.senderId),
            receiverId: String(msg.receiverId),
            sender: {
              ...msg.sender,
              id: String(msg.sender.id),
            },
          }));
          setMessages(formattedMessages);
        }

        if (chatClient.isSocketConnected()) {
          chatClient.disconnect();
        }

        try {
          await chatClient.connect(token);
          setConnectionState('connected');
        } catch (err) {
          console.error('WebSocket连接失败:', err);
          setConnectionState('disconnected');
        }

        chatClient.joinConversation(parseInt(otherUserId));
        chatClient.markAsRead(parseInt(otherUserId));
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setLoading(false);
      }
    };

    initializeChat();

    const unsubMessage = chatClient.onMessage((message: ChatMessage) => {
      if (message.senderId === parseInt(otherUserId)) {
        setMessages(prev => {
          const exists = prev.some(m => m.id === message.id.toString());
          if (exists) return prev;
          return [...prev, {
            ...message,
            id: message.id.toString(),
            senderId: message.senderId.toString(),
            receiverId: message.receiverId.toString(),
            sender: message.sender ? {
              ...message.sender,
              id: message.sender.id.toString(),
              avatarCid: (message.sender as any).avatarCid ?? undefined,
            } : {
              id: message.senderId.toString(),
              username: chatUser?.username || '未知用户',
              avatarCid: chatUser?.avatarCid ?? undefined
            }
          }];
        });
        chatClient.markAsRead(parseInt(otherUserId));
        if (isNearBottomRef.current) {
          scrollToBottom();
        }
      }
    });

    const unsubSent = chatClient.onMessageSent((message: ChatMessage) => {
      setPendingMessages(prev => {
        const newPending = new Map(prev);
        newPending.delete(message.tempId || '');
        return newPending;
      });
      
      setMessages(prev => {
        const tempIndex = prev.findIndex(m => m.tempId === message.tempId);
        if (tempIndex !== -1) {
          const newMessages = [...prev];
          newMessages[tempIndex] = {
            ...message,
            id: message.id.toString(),
            senderId: message.senderId.toString(),
            receiverId: message.receiverId.toString(),
            sender: message.sender ? {
              ...message.sender,
              id: message.sender.id.toString(),
              avatarCid: message.sender.avatarCid ?? undefined,
            } : {
              id: message.senderId.toString(),
              username: currentUser?.username || '未知用户',
              avatarCid: currentUser?.avatarCid ?? undefined
            }
          };
          return newMessages;
        }
        return prev;
      });
    });

    const unsubTyping = chatClient.onTyping((typing) => {
      if (typing.userId === parseInt(otherUserId)) {
        setTypingUser(typing.isTyping ? typing.username : null);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        if (typing.isTyping) {
          typingTimeoutRef.current = setTimeout(() => {
            setTypingUser(null);
          }, 3000);
        }
      }
    });

    const unsubStatus = chatClient.onUserStatus((status) => {
      if (status.userId === parseInt(otherUserId)) {
        // 状态更新会通过 useOnlineStatus hook 自动处理
      }
    });

    const unsubError = chatClient.onError((err) => {
      setError(err.message);
      if (err.tempId) {
        setPendingMessages(prev => {
          const newPending = new Map(prev);
          newPending.delete(err.tempId || '');
          return newPending;
        });
        setMessages(prev => prev.filter(m => m.tempId !== err.tempId));
      }
    });

    const unsubConnection = chatClient.onConnectionStateChange((state) => {
      setConnectionState(state.isConnected ? 'connected' : state.isConnecting ? 'connecting' : 'disconnected');
    });

    return () => {
      unsubMessage();
      unsubSent();
      unsubTyping();
      unsubStatus();
      unsubError();
      unsubConnection();
      chatClient.leaveConversation(parseInt(otherUserId));
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [currentUser, otherUserId, router, scrollToBottom, chatUser?.username, chatUser?.avatarCid, authLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (chatClient.isSocketConnected()) {
      chatClient.sendTypingIndicator(parseInt(otherUserId), true);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        chatClient.sendTypingIndicator(parseInt(otherUserId), false);
      }, 1000);
    }
  };

  const renderMessageContent = (content: string, isMe: boolean) => {
    const urlRegex = /(https?:\/\/[^\s<]+)/g;
    const postUrlPattern = /\/content\/(\d+)/;
    const parts = content.split(urlRegex);

    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        urlRegex.lastIndex = 0;
        const postMatch = part.match(postUrlPattern);
        if (postMatch) {
          const postId = postMatch[1];
          const internalPath = `/content/${postId}`;
          return (
            <Link
              key={index}
              href={internalPath}
              className={`underline hover:no-underline ${isMe ? 'text-purple-200 hover:text-white' : 'text-[#6364FF] hover:text-[#5558DD]'}`}
            >
              {part}
            </Link>
          );
        }
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className={`underline hover:no-underline ${isMe ? 'text-purple-200 hover:text-white' : 'text-[#6364FF] hover:text-[#5558DD]'}`}
          >
            {part}
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatUser || !currentUser) return;

    const content = newMessage.trim();
    setNewMessage('');
    setError(null);

    if (chatClient.isSocketConnected()) {
      try {
        const tempId = chatClient.sendMessage(parseInt(otherUserId), content);
        
        const tempMessage: Message = {
          id: tempId,
          tempId,
          content,
          senderId: currentUser.id.toString(),
          receiverId: otherUserId,
          createdAt: new Date().toISOString(),
          isRead: false,
          sender: {
            id: currentUser.id.toString(),
            username: currentUser.username,
            avatarCid: currentUser.avatarCid ?? undefined,
          },
        };
        
        setMessages(prev => [...prev, tempMessage]);
        setPendingMessages(prev => new Map(prev).set(tempId, tempMessage));
        
        chatClient.sendTypingIndicator(parseInt(otherUserId), false);
        
        setTimeout(() => {
          setPendingMessages(prev => {
            const newPending = new Map(prev);
            newPending.delete(tempId);
            return newPending;
          });
        }, 3000);
      } catch (err) {
        setError('发送失败，请重试');
      }
    } else {
      setSending(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/messages/${otherUserId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content }),
        });

        if (response.ok) {
          const sentMessage = await response.json();
          const formattedMessage = {
            ...sentMessage,
            id: String(sentMessage.id),
            senderId: String(sentMessage.senderId),
            receiverId: String(sentMessage.receiverId),
            sender: {
              ...sentMessage.sender,
              id: String(sentMessage.sender.id),
            },
          };
          setMessages(prev => [...prev, formattedMessage]);
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || '发送失败');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '发送失败');
      } finally {
        setSending(false);
      }
    }
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleString('zh-CN', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  if (authLoading || !currentUser) {
    if (authLoading) {
      return (
        <div className="max-w-4xl mx-auto px-4 py-6 h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6364FF]" />
        </div>
      );
    }
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 h-[calc(100vh-5rem)] flex flex-col">
      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-3">
              <BackButton />
              {chatUser && (
                <>
                  <div>
                    <div>
                      <UserDisplay
                        nickname={chatUser.nickname}
                        username={chatUser.username}
                        size="md"
                        layout="stack"
                        className=""
                      />
                      <div className="flex items-center gap-2">
                        {typingUser ? (
                          <span className="text-xs text-[#6364FF] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-[#6364FF] rounded-full animate-pulse" />
                            正在输入...
                          </span>
                        ) : statusLoading ? (
                          <span className="text-xs text-gray-400">加载中...</span>
                        ) : (
                          <>
                            {isOnline ? (
                              <span className="text-xs text-green-600 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                在线
                              </span>
                            ) : (
                              <span className="text-xs text-gray-500">
                                {lastSeen ? `上次在线: ${formatLastSeen(lastSeen)}` : '离线'}
                              </span>
                            )}
                          </>
                        )}
                        {connectionState !== 'connected' && (
                          <span className={`text-xs ${
                            connectionState === 'connecting' ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            ({connectionState === 'connecting' ? '连接中...' : '已断开'})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

        {error && (
          <div className="p-3 bg-red-50 border-b border-red-100">
            <p className="text-sm text-red-600 text-center">{error}</p>
          </div>
        )}

        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
          onScroll={() => {
            isNearBottomRef.current = checkIfNearBottom();
          }}
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6364FF]" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p>开始聊天吧</p>
            </div>
          ) : (
            <>
              {messages.map((message, index) => {
                const isMe = message.senderId === currentUser?.id.toString();
                const showAvatar = index === 0 || messages[index - 1]!.senderId !== message.senderId;
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-end gap-2 max-w-[70%] ${isMe ? 'flex-row-reverse' : ''}`}>
                      {!isMe && showAvatar && (
                        <LinkWithBack href={`/profile/${message.sender.username}`} className="cursor-pointer hover:opacity-80 transition-opacity">
                          <Avatar
                            src={getIPFSUrl(message.sender.avatarCid ?? undefined)}
                            alt={message.sender.username}
                            size="sm"
                          />
                        </LinkWithBack>
                      )}
                      {!isMe && !showAvatar && <div className="w-8" />}
                      {isMe && showAvatar && (
                        <Avatar
                          src={getIPFSUrl(currentUser?.avatarCid ?? undefined)}
                          alt={currentUser?.username || '我'}
                          size="sm"
                        />
                      )}
                      {isMe && !showAvatar && <div className="w-8" />}
                      
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          isMe
                            ? 'bg-blue-600 text-white rounded-br-md'
                            : 'bg-gray-100 text-gray-900 rounded-bl-md'
                        } ${pendingMessages.has(message.tempId || '') ? 'opacity-70' : ''}`}
                      >
                        <p>{renderMessageContent(message.content, isMe)}</p>
                        <p className={`text-xs mt-1 ${isMe ? 'text-blue-200' : 'text-gray-500'}`}>
                          {formatTime(message.createdAt)}
                          {isMe && message.isRead && (
                            <span className="ml-1">已读</span>
                          )}
                          {pendingMessages.has(message.tempId || '') && (
                            <span className="ml-1">发送中...</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <form onSubmit={handleSendMessage} className="p-4 border-t bg-gray-50">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={handleInputChange}
              placeholder={connectionState === 'connected' ? "输入消息..." : "连接中..."}
              disabled={sending}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <Button
              type="submit"
              disabled={!newMessage.trim() || sending}
              isLoading={sending}
            >
              发送
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
