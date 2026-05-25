'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { uploadToIPFS, getIPFSUrl } from '@/lib/ipfs';
import { createMoment } from '@/lib/api';
import Button from '@/components/ui/Button';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Topic {
  id: number;
  name: string;
  postCount: number;
}

export default function MomentCreator() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'followers'>(user?.defaultVisibility as 'public' | 'followers' || 'public');
  const [media, setMedia] = useState<File | null>(null);
  const [mediaCidInput, setMediaCidInput] = useState('');
  const [showIpfsImport, setShowIpfsImport] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showTopicSuggestions, setShowTopicSuggestions] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isRepost, setIsRepost] = useState(false);
  const [repostAddition, setRepostAddition] = useState('');
  const tagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await fetch(`${API_URL}/topics?take=20`);
        if (response.ok) {
          const data = await response.json();
          setTopics(data);
        }
      } catch (err) {
        console.error('获取话题列表失败:', err);
      }
    };
    fetchTopics();
  }, []);

  useEffect(() => {
    if (!tagInput.trim()) {
      setShowTopicSuggestions(false);
      return;
    }
    const searchTopics = async () => {
      try {
        const response = await fetch(`${API_URL}/topics/search?keyword=${encodeURIComponent(tagInput)}`);
        if (response.ok) {
          const data = await response.json();
          setTopics(data);
          setShowTopicSuggestions(true);
        }
      } catch (err) {
        console.error('搜索话题失败:', err);
      }
    };
    const debounceTimer = setTimeout(searchTopics, 300);
    return () => clearTimeout(debounceTimer);
  }, [tagInput]);

  useEffect(() => {
    if (user?.defaultVisibility) {
      setVisibility(user.defaultVisibility as 'public' | 'followers');
    }
  }, [user]);

  useEffect(() => {
    const repostParam = searchParams.get('repost');
    if (repostParam) {
      setIsRepost(true);
      const [type, id] = repostParam.split('_');
      if (type && id) {
        fetchRepostContent(type, id);
      }
    }
  }, [searchParams]);

  const fetchRepostContent = async (type: string, id: string) => {
    try {
      const basePath = type === 'article' ? '/content/articles' : '/content/moments';
      const response = await fetch(`${API_URL}${basePath}/${id}`);
      if (response.ok) {
        const postData = await response.json();
        const postUrl = `${window.location.origin}/content/${type}/${id}`;
        const repostContent = `转发${type === 'article' ? '文章' : '动态'}
「${postData.content.substring(0, 100)}${postData.content.length > 100 ? '...' : ''}」

原文链接: ${postUrl}`;
        setContent(repostContent);
        if (postData.mediaCid) {
          setMediaPreview(getIPFSUrl(postData.mediaCid));
        }
      }
    } catch (err) {
      console.error('获取转发内容失败:', err);
    }
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMedia(e.target.files[0]);
      setMediaCidInput('');
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const parseCidFromInput = (input: string): string => {
    const trimmed = input.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('ipfs://')) return trimmed.substring(7);
    if (trimmed.startsWith('/ipfs/')) return trimmed.substring(6);
    return trimmed;
  };

  const handleIpfsImport = () => {
    const cid = parseCidFromInput(mediaCidInput);
    if (!cid) {
      alert('请输入有效的IPFS标识');
      return;
    }
    setMedia(null);
    setMediaPreview(getIPFSUrl(cid));
    setShowIpfsImport(false);
  };

  const addTag = (tagName: string) => {
    const trimmed = tagName.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput('');
    setShowTopicSuggestions(false);
    tagInputRef.current?.focus();
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      removeTag(tags[tags.length - 1]!);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let mediaCid: string | undefined = undefined;

      if (media) {
        const result = await uploadToIPFS(media);
        mediaCid = result.cid?.toString();
      } else if (mediaCidInput) {
        mediaCid = parseCidFromInput(mediaCidInput);
      }

      const finalContent = isRepost ? `${repostAddition}\n\n${content}` : content;
      
      if (isRepost) {
        // 转发模式下，只创建动态并更新计数器，不调用repost API（避免重复创建）
        const moment = await createMoment({
          content: finalContent,
          visibility,
          mediaCid: mediaCid || undefined,
          tags: tags.join(','),
        });

        // 只更新原帖子的转发计数器（使用count_only模式，不创建新动态）
        const repostParam = searchParams.get('repost');
        if (repostParam) {
          const [type, id] = repostParam.split('_');
          if (type && id) {
            try {
              const basePath = type === 'article' ? '/content/articles' : '/content/moments';
              const response = await fetch(`${API_URL}${basePath}/${id}/repost?action=count_only`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
              });
              if (!response.ok) {
                console.warn('更新转发计数器失败:', await response.json());
              }
            } catch (err) {
              console.warn('更新转发计数器失败:', err);
            }
          }
        }
        
        router.back();
      } else {
        // 正常发布模式
        const moment = await createMoment({
          content: finalContent,
          visibility,
          mediaCid: mediaCid || undefined,
          tags: tags.join(','),
        });
        router.push(`/content/${moment.id}`);
      }
      router.refresh();
    } catch (err) {
      setError('发布失败，请稍后再试');
      console.error('发布失败:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">动态内容</label>
        {isRepost ? (
          <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl min-h-[300px] transition-all duration-200">
            <textarea
              placeholder="添加你的想法..."
              value={repostAddition}
              onChange={(e) => setRepostAddition(e.target.value)}
              className="w-full border-none outline-none bg-transparent min-h-[100px] resize-none font-bold text-lg text-gray-900 mb-4"
            />
            <div className="mt-4 p-4 bg-white border border-gray-100 rounded-lg">
              <div className="text-sm text-gray-500 mb-2">转发内容</div>
              <div className="text-gray-700">
                {content.split('\n原文链接:')[0]}
                <div className="mt-2 text-blue-600">
                  原文链接: {content.split('\n原文链接:')[1]}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <textarea
            placeholder="分享你的想法..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#6364FF] focus:ring-2 focus:ring-[#6364FF]/20 focus:bg-white min-h-[200px] transition-all duration-200 resize-none"
          />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">媒体附件</label>
        {!isRepost ? (
          <>
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => document.getElementById('media-upload')?.click()}
                className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 text-sm text-gray-600 transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                选择本地照片
              </button>
              <button
                type="button"
                onClick={() => setShowIpfsImport(!showIpfsImport)}
                className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 text-sm text-gray-600 transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                从IPFS导入
              </button>
            </div>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleMediaChange}
              className="hidden"
              id="media-upload"
            />
            {showIpfsImport && (
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="输入CID / IPFS路径 / IPFS URL"
                  value={mediaCidInput}
                  onChange={(e) => setMediaCidInput(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6364FF]/20"
                />
                <button
                  type="button"
                  onClick={handleIpfsImport}
                  className="px-4 py-2 bg-[#6364FF] text-white rounded-lg hover:bg-[#5558DD] text-sm transition-colors"
                >
                  导入
                </button>
              </div>
            )}
            {(media || mediaPreview) && (
              <div className="mt-2 relative group">
                <img src={mediaPreview} alt="媒体预览" className="w-full max-h-48 object-cover rounded-xl" />
                <button
                  type="button"
                  onClick={() => {
                    setMedia(null);
                    setMediaCidInput('');
                    setMediaPreview('');
                  }}
                  className="absolute top-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  移除
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <p className="text-sm text-gray-600">转发模式下，媒体附件将自动从原文获取</p>
            {mediaPreview && (
              <div className="mt-2 relative group">
                <img src={mediaPreview} alt="媒体预览" className="w-full max-h-48 object-cover rounded-xl" />
              </div>
            )}
          </div>
        )}
      </div>

      {!isRepost && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">话题标签</label>
          <div className="flex flex-wrap gap-2 p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus-within:border-[#6364FF] focus-within:ring-2 focus-within:ring-[#6364FF]/20 focus-within:bg-white transition-all duration-200">
            {tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#6364FF]/10 text-[#6364FF] rounded-lg text-sm font-medium"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-[#6364FF]/60 hover:text-[#6364FF] transition-colors"
                >
                  ×
                </button>
              </span>
            ))}
            <input
              ref={tagInputRef}
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInputKeyDown}
              onFocus={() => tagInput.trim() && setShowTopicSuggestions(true)}
              placeholder={tags.length === 0 ? '输入话题后按回车添加...' : '继续添加...'}
              className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm placeholder-gray-400"
            />
          </div>
          {showTopicSuggestions && topics.length > 0 && (
            <div className="mt-1 border border-gray-200 rounded-xl max-h-40 overflow-y-auto bg-white shadow-lg z-10">
              {topics.map(topic => (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => addTag(topic.name)}
                  className="w-full px-4 py-2.5 hover:bg-[#F0EFFF] text-left flex justify-between items-center text-sm transition-colors"
                >
                  <span className="text-[#6364FF] font-medium">#{topic.name}</span>
                  <span className="text-gray-400 text-xs">{topic.postCount} 条帖子</span>
                </button>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-1.5">输入话题名称后按回车添加，可选择已有话题或创建新话题</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">可见范围</label>
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as 'public' | 'followers')}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#6364FF] focus:ring-2 focus:ring-[#6364FF]/20 focus:bg-white transition-all duration-200"
        >
          <option value="public">🌐 公开 - 所有人可见</option>
          <option value="followers">👥 仅关注者 - 仅粉丝可见</option>
        </select>
      </div>

      {error && (
        <div className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{error}</div>
      )}

      <div className="flex gap-3 pt-6 border-t border-gray-100">
        <Button
          type="submit"
          variant="primary"
          isLoading={loading}
          className="flex-1"
        >
          {isRepost ? '转发' : '发布动态'}
        </Button>
        <Link href="/">
          <Button variant="secondary">
            取消
          </Button>
        </Link>
      </div>
    </form>
  );
}
