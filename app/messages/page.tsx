'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useOnlineUsers, formatLastSeen } from '@/lib/hooks/useOnlineStatus';
import { chatClient } from '@/lib/chat';
import { getIPFSUrl } from '@/lib/ipfs';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import BackButton from '@/components/common/BackButton';
import OnlineStatusIndicator from '@/components/common/OnlineStatusIndicator';


interface Conversation {
  userId: string;
  user: {
    id: string;
    username: string;
    nickname?: string;
    avatarCid?: string;
  };
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'reply' | 'follow';
  user: {
    id: string;
    username: string;
    nickname?: string;
    avatarCid?: string;
  };
  articleId?: number;
  momentId?: number;
  postId?: string;
  postContent?: string;
  commentContent?: string;
  content?: string;
  createdAt: string;
  isRead: boolean;
  postDeleted?: boolean;
}

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { onlineUsers } = useOnlineUsers();
  const [activeTab, setActiveTab] = useState<'likes' | 'replies' | 'messages'>('messages');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [likes, setLikes] = useState<Notification[]>([]);
  const [replies, setReplies] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [wsConnected, setWsConnected] = useState(false);

  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [deletedPostIds, setDeletedPostIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'likes' || tab === 'replies' || tab === 'messages') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const checkPostExists = useCallback(async (articleId?: number, momentId?: number): Promise<boolean> => {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      if (articleId) {
        const res = await fetch(`/api/content/articles/${articleId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return res.ok;
      }
      if (momentId) {
        const res = await fetch(`/api/content/moments/${momentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return res.ok;
      }
    } catch {
      return false;
    }
    return false;
  }, []);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setLoading(true);

      const [messagesRes, notificationsRes] = await Promise.all([
        fetch('/api/messages/list', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/notifications', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (messagesRes.ok) {
        const data = await messagesRes.json();
        const filteredConversations = data.filter((conv: Conversation) => {
          return conv.userId !== user?.id;
        });
        setConversations(filteredConversations);
        const total = filteredConversations.reduce(
          (sum: number, conv: Conversation) => sum + conv.unreadCount,
          0
        );
        setUnreadTotal(total);
      }

      if (notificationsRes.ok) {
        const notifications = await notificationsRes.json();
        const likeNotifications = notifications.filter((n: Notification) => n.type === 'like');
        const replyNotifications = notifications.filter((n: Notification) => n.type === 'comment' || n.type === 'reply');
        setLikes(likeNotifications);
        setReplies(replyNotifications);
      }
    } catch (err) {
      console.error('获取消息列表失败:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!isAuthenticated || !user) {
      router.push('/auth/sign-in');
      return;
    }

    fetchData();

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/sign-in');
      return;
    }

    const connectSocket = async () => {
      try {
        const connectionState = chatClient.getConnectionState();
        if (!chatClient.isSocketConnected() && !connectionState.isConnecting) {
          await chatClient.connect(token);
          setWsConnected(true);
        } else {
          setWsConnected(true);
        }
      } catch (err) {
        console.error('WebSocket连接失败:', err);
        setWsConnected(false);
      }
    };

    connectSocket();

    const unsubConnected = chatClient.onConnected(() => {
      setWsConnected(true);
    });

    const unsubMessage = chatClient.onMessage(() => {
      fetchData();
    });

    return () => {
      unsubConnected();
      unsubMessage();
    };
  }, [isAuthenticated, user, router, authLoading, fetchData]);

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
  };

  const markNotificationAsRead = async (notificationId: string, type: 'like' | 'comment') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        if (type === 'like') {
          setLikes(prev => prev.map(like =>
            like.id === notificationId ? { ...like, isRead: true } : like
          ));
        } else if (type === 'comment') {
          setReplies(prev => prev.map(reply =>
            reply.id === notificationId ? { ...reply, isRead: true } : reply
          ));
        }
      }
    } catch (error) {
      console.error('标记通知为已读失败:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setMarkingAllRead(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setLikes(prev => prev.map(like => ({ ...like, isRead: true })));
        setReplies(prev => prev.map(reply => ({ ...reply, isRead: true })));
      }
    } catch (error) {
      console.error('一键已读失败:', error);
    } finally {
      setMarkingAllRead(false);
    }
  };

  const handleNotificationClick = async (notification: Notification, type: 'like' | 'comment') => {
    await markNotificationAsRead(notification.id, type);

    const postId = notification.articleId || notification.momentId;
    const postKey = `${notification.articleId ? 'article' : 'moment'}-${postId}`;

    if (deletedPostIds.has(postKey)) {
      alert('该文章/动态已被删除');
      return;
    }

    if (postId) {
      const exists = await checkPostExists(notification.articleId, notification.momentId);
      if (!exists) {
        setDeletedPostIds(prev => new Set(prev).add(postKey));
        alert('该文章/动态已被删除');
        return;
      }
      router.push(`/content/${postId}`);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleDeleteMode = () => {
    setDeleteMode(true);
    setSelectedIds(new Set());
  };

  const handleCancelDelete = () => {
    setDeleteMode(false);
    setSelectedIds(new Set());
  };

  const handleConfirmDelete = async () => {
    if (selectedIds.size === 0) {
      setDeleteMode(false);
      return;
    }

    try {
      setDeleting(true);
      const token = localStorage.getItem('token');
      const ids = Array.from(selectedIds).map(id => parseInt(id));

      const response = await fetch('/api/notifications/batch-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids }),
      });

      if (response.ok) {
        setLikes(prev => prev.filter(like => !selectedIds.has(like.id)));
        setReplies(prev => prev.filter(reply => !selectedIds.has(reply.id)));
        setDeleteMode(false);
        setSelectedIds(new Set());
      }
    } catch (error) {
      console.error('删除通知失败:', error);
    } finally {
      setDeleting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">加载中...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const hasUnread = likes.some(l => !l.isRead) || replies.some(r => !r.isRead);

  const totalCounts = {
    messages: conversations.length,
    likes: likes.length,
    replies: replies.length
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Card variant="glass">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <BackButton fallback="/" />
              <h1 className="text-2xl font-bold text-gray-900">消息中心</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                wsConnected 
                  ? 'bg-green-50 text-green-700' 
                  : 'bg-red-50 text-red-700'
              }`}>
                <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                {wsConnected ? '实时连接' : '离线'}
              </div>

              {!deleteMode && hasUnread && activeTab !== 'messages' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleMarkAllRead}
                  disabled={markingAllRead}
                  className="!rounded-lg"
                >
                  ✓ 一键已读
                </Button>
              )}

              {!deleteMode && (totalCounts[activeTab] > 0) && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDeleteMode}
                  className="!rounded-lg"
                >
                  🗑️ 删除
                </Button>
              )}

              {deleteMode && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleConfirmDelete}
                    disabled={deleting || selectedIds.size === 0}
                    className="!rounded-lg"
                  >
                    {deleting ? '删除中...' : `确认删除${selectedIds.size > 0 ? `(${selectedIds.size})` : ''}`}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCancelDelete}
                    disabled={deleting}
                    className="!rounded-lg"
                  >
                    取消
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 bg-gray-100 p-1 rounded-xl">
            {[
              { key: 'messages' as const, label: '私信', icon: '💬', count: unreadTotal },
              { key: 'likes' as const, label: '赞', icon: '❤️', count: likes.filter(l => !l.isRead).length },
              { key: 'replies' as const, label: '回复', icon: '💬', count: replies.filter(r => !r.isRead).length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setDeleteMode(false); setSelectedIds(new Set()); }}
                className={`relative px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'bg-white text-[#6364FF] shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <span>{tab.icon} {tab.label}</span>
                {tab.count > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 min-h-[400px]">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-xl animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {activeTab === 'messages' && (
                <div className="space-y-2">
                  {conversations.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="text-6xl mb-4">💬</div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无私信消息</h3>
                      <p className="text-gray-500 text-sm">开始与其他用户交流吧</p>
                    </div>
                  ) : (
                    conversations.map((conv) => {
                      const isOnline = onlineUsers.includes(parseInt(conv.userId));
                      return (
                        <Link key={conv.userId} href={`/messages/${conv.userId}`}>
                          <div className={`group flex items-center gap-4 p-4 rounded-xl transition-all duration-200 cursor-pointer border ${
                            conv.unreadCount > 0 
                              ? 'bg-gradient-to-r from-[#F0EFFF] to-white border-[#6364FF]/20 hover:border-[#6364FF]' 
                              : 'bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-200'
                          }`}>
                            {deleteMode && (
                              <input
                                type="checkbox"
                                checked={selectedIds.has(conv.userId)}
                                onChange={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toggleSelect(conv.userId);
                                }}
                                className="w-4 h-4 rounded border-gray-300 text-[#6364FF] focus:ring-[#6364FF]"
                              />
                            )}
                            
                            <div className="relative flex-shrink-0">
                              <Avatar
                                src={getIPFSUrl(conv.user.avatarCid)}
                                alt={conv.user.username}
                                size="lg"
                              />
                              <div className="absolute -bottom-0.5 -right-0.5">
                                <OnlineStatusIndicator userId={conv.userId} size="sm" />
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="font-semibold text-gray-900 truncate">
                                  {conv.user.nickname && conv.user.nickname !== conv.user.username
                                    ? `${conv.user.nickname}`
                                    : `@${conv.user.username}`}
                                </h3>
                                <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                  {formatTime(conv.lastMessageTime)}
                                </span>
                              </div>
                              {conv.user.nickname && conv.user.nickname !== conv.user.username && (
                                <div className="text-xs text-gray-500">
                                  @{conv.user.username}
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between">
                                <p className={`text-sm truncate ${
                                  conv.unreadCount > 0 
                                    ? 'text-gray-900 font-medium' 
                                    : 'text-gray-500'
                                }`}>
                                  {conv.lastMessage}
                                </p>
                                
                                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                                  {conv.unreadCount > 0 && (
                                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                                      {conv.unreadCount}
                                    </span>
                                  )}
                                  
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                    isOnline 
                                      ? 'bg-green-100 text-green-700' 
                                      : 'bg-gray-100 text-gray-500'
                                  }`}>
                                    {isOnline ? '在线' : '离线'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>
              )}

              {activeTab === 'likes' && (
                <div className="space-y-2">
                  {likes.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="text-6xl mb-4">❤️</div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无赞的通知</h3>
                      <p className="text-gray-500 text-sm">当有人点赞你的内容时会显示在这里</p>
                    </div>
                  ) : (
                    likes.map((like) => {
                      const postKey = `${like.articleId ? 'article' : 'moment'}-${like.articleId || like.momentId}`;
                      const isPostDeleted = deletedPostIds.has(postKey);

                      return (
                        <div
                          key={like.id}
                          className={`group flex items-start gap-4 p-4 rounded-xl transition-all duration-200 cursor-pointer border ${
                            !like.isRead 
                              ? 'bg-gradient-to-r from-red-50 to-white border-red-100 hover:border-red-300' 
                              : 'bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-200'
                          }`}
                          onClick={() => {
                            if (!deleteMode) {
                              if (isPostDeleted) {
                                alert('该文章/动态已被删除');
                                return;
                              }
                              handleNotificationClick(like, 'like');
                            }
                          }}
                        >
                          {deleteMode && (
                            <input
                              type="checkbox"
                              checked={selectedIds.has(like.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleSelect(like.id);
                              }}
                              className="mt-1 w-4 h-4 rounded border-gray-300 text-[#6364FF] focus:ring-[#6364FF]"
                            />
                          )}
                          
                          <div className="relative flex-shrink-0">
                            <Avatar
                              src={getIPFSUrl(like.user.avatarCid)}
                              alt={like.user.username}
                              size="lg"
                            />
                            {!like.isRead && !deleteMode && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {like.user.nickname && like.user.nickname !== like.user.username
                                  ? `${like.user.nickname}`
                                  : `@${like.user.username}`}
                              </h3>
                              <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                {formatTime(like.createdAt)}
                              </span>
                            </div>
                            
                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                              {isPostDeleted ? (
                                <p className="text-sm text-red-500 font-medium">该文章/动态已被删除</p>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-red-500">❤️</span>
                                    <span className="text-sm font-medium text-gray-700">赞了你的内容</span>
                                  </div>
                                  {like.postContent && (
                                    <p className="text-xs text-gray-500 mt-1 pl-6 line-clamp-2">
                                      "{like.postContent.substring(0, 80)}{like.postContent.length > 80 ? '...' : ''}"
                                    </p>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {activeTab === 'replies' && (
                <div className="space-y-2">
                  {replies.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="text-6xl mb-4">💬</div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无回复通知</h3>
                      <p className="text-gray-500 text-sm">当有人评论或回复你的内容时会显示在这里</p>
                    </div>
                  ) : (
                    replies.map((reply) => {
                      const postKey = `${reply.articleId ? 'article' : 'moment'}-${reply.articleId || reply.momentId}`;
                      const isPostDeleted = deletedPostIds.has(postKey);

                      return (
                        <div
                          key={reply.id}
                          className={`group flex items-start gap-4 p-4 rounded-xl transition-all duration-200 cursor-pointer border ${
                            !reply.isRead 
                              ? 'bg-gradient-to-r from-blue-50 to-white border-blue-100 hover:border-blue-300' 
                              : 'bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-200'
                          }`}
                          onClick={() => {
                            if (!deleteMode) {
                              if (isPostDeleted) {
                                alert('该文章/动态已被删除');
                                return;
                              }
                              handleNotificationClick(reply, 'comment');
                            }
                          }}
                        >
                          {deleteMode && (
                            <input
                              type="checkbox"
                              checked={selectedIds.has(reply.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleSelect(reply.id);
                              }}
                              className="mt-1 w-4 h-4 rounded border-gray-300 text-[#6364FF] focus:ring-[#6364FF]"
                            />
                          )}
                          
                          <div className="relative flex-shrink-0">
                            <Avatar
                              src={getIPFSUrl(reply.user.avatarCid)}
                              alt={reply.user.username}
                              size="lg"
                            />
                            {!reply.isRead && !deleteMode && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {reply.user.nickname && reply.user.nickname !== reply.user.username
                                  ? `${reply.user.nickname}`
                                  : `@${reply.user.username}`}
                              </h3>
                              <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                {formatTime(reply.createdAt)}
                              </span>
                            </div>
                            
                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                              {isPostDeleted ? (
                                <p className="text-sm text-red-500 font-medium">该文章/动态已被删除</p>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-blue-500">💬</span>
                                    <span className="text-sm font-medium text-gray-700">评论了你的内容</span>
                                  </div>
                                  {reply.commentContent && (
                                    <div className="mt-2 pl-6 border-l-2 border-blue-200">
                                      <p className="text-xs text-gray-600 italic line-clamp-3">
                                        "{reply.commentContent}"
                                      </p>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
