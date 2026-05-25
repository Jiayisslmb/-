'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { searchUsers } from '@/lib/api';
import PostItem from '@/components/content/PostItem';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Link from 'next/link';
import BackButton from '@/components/common/BackButton';
import { getIPFSUrl } from '@/lib/ipfs';


interface Topic {
  id: number;
  name: string;
  description?: string;
  postCount: number;
}

interface SearchResult {
  id: number;
  type: 'article' | 'moment';
  title?: string;
  content: string;
  coverCid?: string;
  mediaCid?: string;
  createdAt: string;
  author: {
    id: number;
    username: string;
    nickname?: string;
    avatarCid?: string;
  };
  likes: number;
  comments: number;
  shares: number;
  circle?: { id: number; name: string };
  tags?: string[];
  visibility?: string;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const [searchInput, setSearchInput] = useState(query);
  const [users, setUsers] = useState<any[]>([]);
  const [posts, setPosts] = useState<SearchResult[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'users' | 'posts' | 'topics'>('all');

  useEffect(() => {
    const fetchSearchResults = async () => {
      setLoading(true);
      setError('');

      try {
        if (!query) {
          setLoading(false);
          return;
        }

        const token = localStorage.getItem('token');
        if (token) {
          try {
            await fetch(`/api/topics/search`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ keyword: query }),
            });
          } catch (err) {
            console.error('记录搜索失败:', err);
          }
        }

        const [userResults, contentResults, topicsResults] = await Promise.allSettled([
          searchUsers(query),
          fetch(`/api/content/search?q=${encodeURIComponent(query)}&take=50`).then(res => {
            if (!res.ok) return [];
            return res.text().then(text => text ? JSON.parse(text) : []);
          }),
          fetch(`/api/topics/search?keyword=${encodeURIComponent(query)}`).then(res => {
            if (!res.ok) return [];
            return res.text().then(text => text ? JSON.parse(text) : []);
          }),
        ]);

        if (userResults.status === 'fulfilled') {
          setUsers(userResults.value || []);
        } else {
          setUsers([]);
        }

        if (contentResults.status === 'fulfilled') {
          const contentData = contentResults.value || [];
          setPosts(contentData.map((item: any) => ({
            ...item,
            id: item.id,
            type: item.type || 'article',
            tags: item.tags ? (typeof item.tags === 'string' ? item.tags.split(',').filter(Boolean) : item.tags) : [],
          })));
        } else {
          setPosts([]);
        }

        if (topicsResults.status === 'fulfilled') {
          setTopics(topicsResults.value || []);
        } else {
          setTopics([]);
        }
      } catch (err) {
        setError('搜索失败，请稍后再试');
        console.error('搜索失败:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query]);

  const handleTopicClick = (topicName: string) => {
    router.push(`/topic/${encodeURIComponent(topicName)}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const convertToPostItemFormat = (item: SearchResult) => {
    return {
      id: String(item.id),
      type: item.type,
      title: item.title,
      content: item.content,
      mediaUrl: getIPFSUrl(item.mediaCid || item.coverCid),
      likes: item.likes,
      comments: item.comments,
      shares: item.shares || 0,
      visibility: (item.visibility || 'public') as 'public' | 'followers',
      createdAt: item.createdAt,
      tags: item.tags || [],
      circleId: item.circle?.id,
      circleName: item.circle?.name,
      author: {
        id: String(item.author?.id || 0),
        username: item.author?.username || '未知用户',
        nickname: item.author?.nickname,
        avatar: getIPFSUrl(item.author?.avatarCid),
        avatarCid: item.author?.avatarCid,
      },
    };
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6">
        <BackButton />
        <div className="mt-4">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">搜索</h1>
          <div className="mt-2 h-1 w-16 bg-gradient-to-r from-[#6364FF] to-[#8B83FF] rounded-full"></div>
        </div>
      </div>

      <form onSubmit={handleSearchSubmit} className="relative mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="搜索用户、内容、话题..."
            className="w-full px-5 py-3.5 pl-12 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#6364FF] focus:ring-2 focus:ring-[#6364FF]/20 transition-all duration-200 shadow-sm"
          />
          <svg
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <button
            type="submit"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-[#6364FF] hover:bg-[#5558DD] text-white font-medium rounded-lg transition-all duration-200"
          >
            搜索
          </button>
        </div>
      </form>

      {query && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { key: 'all' as const, label: '全部', count: null },
            { key: 'users' as const, label: '用户', count: users.length },
            { key: 'posts' as const, label: '内容', count: posts.length },
            { key: 'topics' as const, label: '话题', count: topics.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-[#6364FF] text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {tab.label}
              {tab.count !== null && ` (${tab.count})`}
            </button>
          ))}
        </div>
      )}

      {!query && !loading && (
        <Card variant="elevated" className="text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">输入关键词开始搜索</h3>
          <p className="text-gray-500">搜索用户、文章、动态或话题</p>
        </Card>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">{error}</div>
      ) : query ? (
        <div className="space-y-6">
          {(activeTab === 'all' || activeTab === 'users') && users.length > 0 && (
            <Card variant="elevated" className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                👥 用户
                <span className="text-sm font-normal text-gray-500">({users.length})</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {users.map(user => (
                  <Link
                    key={user.id}
                    href={`/profile/${user.username}`}
                    className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:bg-[#F0EFFF]/30 hover:border-[#6364FF]/30 transition-all duration-200 group"
                  >
                    <Avatar
                      src={getIPFSUrl(user.avatarCid) || user.avatar}
                      name={user.username}
                      size="lg"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-900 group-hover:text-[#6364FF] transition-colors">
                        {user.nickname && user.nickname !== user.username && (
                          <span>{user.nickname}</span>
                        )}
                        <span className="text-gray-600 ml-1">@{user.username}</span>
                      </div>
                      <div className="text-sm text-gray-500 mt-0.5 line-clamp-1">{user.bio || '无简介'}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {(activeTab === 'all' || activeTab === 'posts') && posts.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                📝 内容
                <span className="text-sm font-normal text-gray-500">({posts.length})</span>
              </h2>
              {posts.map(post => (
                <PostItem
                  key={`${post.type}-${post.id}`}
                  post={convertToPostItemFormat(post)}
                  onShare={(postId, newShares) => {
                    setPosts(prev => prev.map(p =>
                      `${p.type}-${p.id}` === postId
                        ? { ...p, shares: newShares }
                        : p
                    ));
                  }}
                />
              ))}
            </div>
          )}

          {(activeTab === 'all' || activeTab === 'topics') && topics.length > 0 && (
            <Card variant="elevated" className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                # 话题
                <span className="text-sm font-normal text-gray-500">({topics.length})</span>
              </h2>
              <div className="space-y-3">
                {topics.map(topic => (
                  <div
                    key={topic.id}
                    onClick={() => handleTopicClick(topic.name)}
                    className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-[#F0EFFF]/30 hover:border-[#6364FF]/30 cursor-pointer transition-all duration-200 group"
                  >
                    <div className="flex-1">
                      <div className="font-bold text-[#6364FF] group-hover:text-[#5558DD] transition-colors">
                        #{topic.name}
                      </div>
                      {topic.description && (
                        <div className="text-sm text-gray-500 mt-1 line-clamp-1">{topic.description}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <span className="px-3 py-1 bg-[#F0EFFF] text-[#6364FF] rounded-full text-sm font-medium">
                        {topic.postCount} 条动态
                      </span>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-[#6364FF] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {users.length === 0 && posts.length === 0 && topics.length === 0 && (
            <Card variant="elevated" className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">未找到相关结果</h3>
              <p className="text-gray-500 mb-6">
                没有找到与 "<strong className="text-[#6364FF]">{query}</strong>" 相关的内容
              </p>
              <div className="space-y-2">
                <p className="text-sm text-gray-400">建议：</p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• 检查输入是否有误</li>
                  <li>• 尝试使用更简短的关键词</li>
                  <li>• 使用 @用户名 精确搜索用户</li>
                </ul>
              </div>
            </Card>
          )}
        </div>
      ) : null}
    </div>
  );
}
