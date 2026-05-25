'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { createArticle } from '@/lib/api';
import { uploadToIPFS, getIPFSUrl } from '@/lib/ipfs';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import BackButton from '@/components/common/BackButton';
import { toast } from '@/lib/toast';


interface Circle {
  id: number;
  name: string;
}

interface Topic {
  id: number;
  name: string;
  postCount: number;
}

export default function CreateArticlePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlCircleId = searchParams.get('circleId');
  const { isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    visibility: 'public' as 'public' | 'followers',
    circleId: urlCircleId || '',
  });
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverCidInput, setCoverCidInput] = useState('');
  const [showIpfsImport, setShowIpfsImport] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showTopicSuggestions, setShowTopicSuggestions] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchCircles = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/circles?take=100`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setCircles(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('获取圈子列表失败:', err);
      }
    };

    const fetchTopics = async () => {
      try {
        const response = await fetch(`/api/topics?take=20`);
        if (response.ok) {
          const data = await response.json();
          setTopics(data);
        }
      } catch (err) {
        console.error('获取话题列表失败:', err);
      }
    };

    if (isAuthenticated) {
      fetchCircles();
      fetchTopics();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!tagInput.trim()) {
      setShowTopicSuggestions(false);
      return;
    }
    const searchTopics = async () => {
      try {
        const response = await fetch(`/api/topics/search?keyword=${encodeURIComponent(tagInput)}`);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const parseCidFromInput = (input: string): string => {
    const trimmed = input.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('ipfs://')) return trimmed.substring(7);
    if (trimmed.startsWith('/ipfs/')) return trimmed.substring(6);
    return trimmed;
  };

  const handleIpfsImport = () => {
    const cid = parseCidFromInput(coverCidInput);
    if (!cid) {
      toast.warning('请输入有效的IPFS标识');
      return;
    }
    setCoverImage(null);
    setCoverPreview(getIPFSUrl(cid));
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
    
    if (!formData.circleId) {
      toast.warning('请选择要关联的圈子');
      return;
    }
    
    setLoading(true);

    try {
      let coverCid: string | undefined = undefined;

      if (coverImage) {
        const result = await uploadToIPFS(coverImage);
        coverCid = result.cid?.toString();
      } else if (coverCidInput) {
        coverCid = parseCidFromInput(coverCidInput);
      }

      const article = await createArticle({
        title: formData.title,
        content: formData.content,
        tags: tags.join(','),
        visibility: formData.visibility,
        circleId: formData.circleId ? parseInt(formData.circleId) : undefined,
        coverCid,
      });

      router.push(`/content/${article.id}`);
      router.refresh();
    } catch (error) {
      console.error('发布失败:', error);
      toast.error('发布失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">请先登录以发布文章</p>
        <Link href="/auth/sign-in">
          <Button variant="primary">前往登录</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <BackButton />
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">发布新文章</h1>
        <div className="mt-2 h-1 w-16 bg-gradient-to-r from-[#6364FF] to-[#8B83FF] rounded-full"></div>
        <p className="text-gray-500 mt-3">撰写文章分享你的见解，文章将关联到圈子中</p>
      </div>

      <Card className="border-gray-200 shadow-sm">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">文章标题</label>
            <input
              name="title"
              placeholder="输入文章标题..."
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#6364FF] focus:ring-2 focus:ring-[#6364FF]/20 focus:bg-white transition-all duration-200 text-lg font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">文章封面</label>
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => document.getElementById('cover-upload')?.click()}
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
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setCoverImage(e.target.files[0]);
                  setCoverCidInput('');
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setCoverPreview(reader.result as string);
                  };
                  reader.readAsDataURL(e.target.files[0]);
                }
              }}
              className="hidden"
              id="cover-upload"
            />
            {showIpfsImport && (
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="输入CID / IPFS路径 / IPFS URL"
                  value={coverCidInput}
                  onChange={(e) => setCoverCidInput(e.target.value)}
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
            {coverPreview && (
              <div className="mt-2 relative group">
                <img src={coverPreview} alt="封面预览" className="w-full max-h-48 object-cover rounded-xl" />
                <button
                  type="button"
                  onClick={() => {
                    setCoverImage(null);
                    setCoverCidInput('');
                    setCoverPreview('');
                  }}
                  className="absolute top-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  移除
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">文章内容</label>
            <textarea
              name="content"
              placeholder="写下你的想法..."
              value={formData.content}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#6364FF] focus:ring-2 focus:ring-[#6364FF]/20 focus:bg-white min-h-[400px] transition-all duration-200 resize-none"
            />
          </div>

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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">关联圈子 <span className="text-red-500">*</span></label>
              <select
                name="circleId"
                value={formData.circleId}
                onChange={handleChange}
                disabled={!!urlCircleId}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#6364FF] focus:ring-2 focus:ring-[#6364FF]/20 focus:bg-white disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200"
              >
                <option value="">请选择圈子</option>
                {circles.map(circle => (
                  <option key={circle.id} value={circle.id}>
                    {circle.name}
                  </option>
                ))}
              </select>
              {urlCircleId && (
                <p className="text-xs text-gray-400 mt-1">当前发布到指定圈子，不可更改</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">可见范围</label>
              <select
                name="visibility"
                value={formData.visibility}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#6364FF] focus:ring-2 focus:ring-[#6364FF]/20 focus:bg-white transition-all duration-200"
              >
                <option value="public">🌐 公开 - 所有人可见</option>
                <option value="followers">👥 仅关注者 - 仅粉丝可见</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-6 border-t border-gray-100">
            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
              className="flex-1"
            >
              发布文章
            </Button>
            <Link href="/">
              <Button variant="secondary">
                取消
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
