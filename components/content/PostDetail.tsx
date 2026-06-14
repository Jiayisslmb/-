'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LinkWithBack from '@/components/common/LinkWithBack';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { useAuth } from '@/lib/auth';
import { formatDate, formatNumber } from '@/lib/utils';
import { getIPFSUrl } from '@/lib/ipfs';
import { toast } from '@/lib/toast';
import ReportModal from '@/components/common/ReportModal';
import { updateMoment, updateArticle } from '@/lib/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ─────────────────────────── Types ───────────────────────────

interface PostAuthor {
  id: string;
  username: string;
  nickname?: string;
  avatar?: string;
  avatarCid?: string;
}

export interface DetailPost {
  id: string;
  author: PostAuthor;
  title?: string;
  content: string;
  mediaCid?: string;
  mediaUrl?: string;
  likes: number;
  comments: number;
  shares: number;
  visibility: string;
  createdAt: string;
  circleId?: number;
  circleName?: string;
  tags?: string[];
}

interface CommentAuthor {
  id: number;
  username: string;
  nickname?: string;
  avatarCid?: string;
}

interface Reply {
  id: number;
  content: string;
  createdAt: string;
  author: CommentAuthor;
  replyTo?: {
    id: number;
    author: { id: number; username: string; nickname?: string };
  };
}

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  author: CommentAuthor;
  replies?: Reply[];
}

interface PostDetailProps {
  post: DetailPost;
  type: 'article' | 'moment';
  onLike?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onRepost?: (postId: string, newShares: number) => void;
}

// ─────────────────────────── Helpers ───────────────────────────

const resolveAvatar = (author: PostAuthor): string =>
  author.avatar || getIPFSUrl(author.avatarCid) || '';

const resolveMedia = (post: DetailPost): string =>
  post.mediaUrl || getIPFSUrl(post.mediaCid) || '';

// ─────────────────────────── Component ───────────────────────────

export default function PostDetail({ post, type, onLike, onDelete, onRepost }: PostDetailProps) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  const isArticle = type === 'article';
  const basePath = isArticle ? '/content/articles' : '/content/moments';
  const commentKey = isArticle ? 'other_articlecomment' : 'other_momentcomment';
  const replyKey = isArticle ? 'articlecomment' : 'momentcomment';
  const postId = post.id;

  // ── Like / Collect / Repost state ──
  const [isLiked, setIsLiked] = useState(false);
  const [isCollected, setIsCollected] = useState(false);
  const [likes, setLikes] = useState(post.likes || 0);
  const [shares, setShares] = useState(post.shares || 0);
  const [heartBounce, setHeartBounce] = useState(false);

  // ── Menu state ──
  const [showMenu, setShowMenu] = useState(false);
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const shareRef = useRef<HTMLDivElement>(null);

  const isRepostContent =
    post.content.includes('转发动态') || post.content.includes('转发文章');
  const hasOriginalLink = post.content.includes('原文链接:');

  // ── Click outside ──
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShowShareOptions(false);
      }
    };
    if (showMenu || showShareOptions) document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [showMenu, showShareOptions]);

  // ── Check like / collect status on mount ──
  useEffect(() => {
    if (!isAuthenticated || !user || !postId) return;
    const token = localStorage.getItem('token');
    (async () => {
      try {
        const lr = await fetch(`/api${basePath}/${postId}/is-liked`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (lr.ok) setIsLiked((await lr.json()).isLiked);
      } catch {}
      try {
        const cr = await fetch(`/api${basePath}/${postId}/is-collected`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cr.ok) setIsCollected((await cr.json()).isCollected);
      } catch {}
    })();
  }, [isAuthenticated, user, postId, basePath]);

  // ── Action handlers ──
  const handleLike = async () => {
    if (!isAuthenticated) { toast.info('请先登录'); return; }
    try {
      const method = isLiked ? 'DELETE' : 'POST';
      const res = await fetch(`/api${basePath}/${post.id}/like`, {
        method,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLikes(data.likes);
        setIsLiked(!isLiked);
        if (!isLiked) { setHeartBounce(true); setTimeout(() => setHeartBounce(false), 300); }
        onLike?.(post.id);
      }
    } catch (err) { console.error('点赞失败:', err); }
  };

  const handleCollect = async () => {
    if (!isAuthenticated) { toast.info('请先登录'); return; }
    try {
      const method = isCollected ? 'DELETE' : 'POST';
      const res = await fetch(`/api${basePath}/${post.id}/collect`, {
        method,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.ok) setIsCollected(!isCollected);
    } catch (err) { console.error('收藏失败:', err); }
  };

  const handleShare = () => {
    if (!isAuthenticated) { toast.info('请先登录'); return; }
    if (isRepostContent) { toast.warning('转发内容不可再次转发'); return; }
    setShowShareOptions(!showShareOptions);
  };

  const handleShareToMoment = () => {
    if (!isAuthenticated) { toast.info('请先登录'); return; }
    setShowShareOptions(false);
    router.push(`/content/create/moment?repost=${isArticle ? 'article' : 'moment'}_${post.id}`);
  };

  const handleShareToFriend = async () => {
    try {
      const postUrl = `${window.location.origin}/content/${isArticle ? 'article' : 'moment'}/${post.id}`;
      try {
        const res = await fetch(`/api${basePath}/${post.id}/repost?action=count_only`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (res.ok) {
          const data = await res.json();
          const ns = data.reposts || data.shares || (shares + 1);
          setShares(ns);
          onRepost?.(post.id, ns);
        } else {
          const ns = shares + 1; setShares(ns); onRepost?.(post.id, ns);
        }
      } catch {
        const ns = shares + 1; setShares(ns); onRepost?.(post.id, ns);
      }
      let copied = false;
      try { await navigator.clipboard.writeText(postUrl); copied = true; } catch {
        const ta = document.createElement('textarea'); ta.value = postUrl;
        ta.style.cssText = 'position:fixed;left:-9999px';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); copied = true; } catch {}
        document.body.removeChild(ta);
      }
      setShowShareOptions(false);
      copied ? toast.success('链接已复制到剪贴板') : toast.warning('链接复制失败，但转发计数已更新');
    } catch (err) { console.error('转发失败:', err); toast.error('转发失败，请重试'); }
  };

  const handleDelete = async () => {
    if (!window.confirm(`确定要删除这篇${isArticle ? '文章' : '动态'}吗？`)) return;
    try {
      const res = await fetch(`/api${basePath}/${post.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.ok) { onDelete?.(post.id); setShowMenu(false); router.refresh(); }
      else { const e = await res.json(); toast.error(e.message || '删除失败'); }
    } catch { toast.error('删除失败，请重试'); }
  };

  const handleChangeVisibility = async (newVisibility: string) => {
    if (!isAuthenticated) {
      toast.info('请先登录');
      return;
    }

    try {
      if (isArticle) {
        await updateArticle(post.id, { visibility: newVisibility } as any);
      } else {
        await updateMoment(post.id, { visibility: newVisibility } as any);
      }
      setShowVisibilityMenu(false);
      router.refresh();
    } catch (err) {
      console.error('修改可见性失败:', err);
      toast.error('修改可见性失败，请重试');
    }
  };

  // ── Comments state ──
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Comment | Reply | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const fetchComments = async () => {
    try {
      setCommentsLoading(true);
      const res = await fetch(`/api${basePath}/${postId}/comments`);
      if (!res.ok) return;
      const data = await res.json();
      const mapped: Comment[] = data.map((c: any) => ({
        id: c.id, content: c.content, createdAt: c.createdAt,
        author: { id: c.user.id, username: c.user.username, nickname: c.user.nickname, avatarCid: c.user.avatarCid },
        replies: (c[commentKey] || []).map((r: any) => ({
          id: r.id, content: r.content, createdAt: r.createdAt,
          author: { id: r.user.id, username: r.user.username, nickname: r.user.nickname, avatarCid: r.user.avatarCid },
          replyTo: r[replyKey] ? { id: r[replyKey].id, author: { id: r[replyKey].user.id, username: r[replyKey].user.username, nickname: r[replyKey].user.nickname } } : undefined,
        })),
      }));
      setComments(mapped);
    } catch (err) { console.error('加载评论失败:', err); }
    finally { setCommentsLoading(false); }
  };

  useEffect(() => { if (postId) fetchComments(); }, [postId, basePath]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCommentSubmit = async () => {
    if (!isAuthenticated) { toast.info('请先登录'); return; }
    if (!newComment.trim()) return;
    try {
      setSubmittingComment(true);
      const res = await fetch(`/api${basePath}/${postId}/comments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      });
      if (res.ok) {
        const nc = await res.json();
        setComments([{ id: nc.id, content: nc.content, createdAt: nc.createdAt, author: { id: nc.user.id, username: nc.user.username, nickname: nc.user.nickname, avatarCid: nc.user.avatarCid }, replies: [] }, ...comments]);
        setNewComment('');
      }
    } catch (err) { console.error('评论失败:', err); }
    finally { setSubmittingComment(false); }
  };

  const handleReplySubmit = async (parentId: number, parentType: 'comment' | 'reply' = 'comment') => {
    if (!isAuthenticated) { toast.info('请先登录'); return; }
    if (!replyContent.trim()) return;
    try {
      const res = await fetch(`/api${basePath}/${postId}/comments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent, replyToId: parentId }),
      });
      if (res.ok) {
        const nr = await res.json();
        const mapped: Reply = {
          id: nr.id, content: nr.content, createdAt: nr.createdAt,
          author: { id: nr.user.id, username: nr.user.username, nickname: nr.user.nickname, avatarCid: nr.user.avatarCid },
          replyTo: nr[replyKey] ? { id: nr[replyKey].id, author: { id: nr[replyKey].user.id, username: nr[replyKey].user.username, nickname: nr[replyKey].user.nickname } } : undefined,
        };
        if (parentType === 'comment') {
          setComments(comments.map(c => c.id === parentId ? { ...c, replies: [...(c.replies || []), mapped] } : c));
        } else {
          setComments(comments.map(c => c.replies?.some(r => r.id === parentId) ? { ...c, replies: [...(c.replies || []), mapped] } : c));
        }
        setReplyContent('');
        setReplyingTo(null);
      }
    } catch (err) { console.error('回复失败:', err); }
  };

  // ── Derived values ──
  const displayName = post.author.nickname || post.author.username || '未知用户';
  const avatarUrl = resolveAvatar(post.author);
  const mediaUrl = resolveMedia(post);

  // ── Render ──
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <div className="mb-2">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#6364FF] transition-colors px-3 py-1.5 rounded-lg hover:bg-[#F0EFFF]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回
        </button>
      </div>

      {/* Post card */}
      <Card className="border-gray-200 shadow-sm overflow-hidden">
        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-3">
          <LinkWithBack href={`/profile/${post.author.username}`} className="flex-shrink-0">
            <Avatar src={avatarUrl} alt={displayName} size="md" />
          </LinkWithBack>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <LinkWithBack
                href={`/profile/${post.author.username}`}
                className="font-semibold text-gray-900 hover:text-[#6364FF] transition-colors text-sm truncate max-w-[160px]"
              >
                {displayName}
              </LinkWithBack>
              {post.author.nickname && post.author.nickname !== post.author.username && (
                <span className="text-gray-400 text-xs truncate max-w-[100px]">@{post.author.username}</span>
              )}
              {isArticle && post.circleId && post.circleName && (
                <LinkWithBack
                  href={`/circles/${post.circleId}`}
                  className="text-[#6364FF] text-xs font-medium bg-[#F0EFFF] px-2 py-0.5 rounded-full hover:bg-[#E0DEFF] transition-colors"
                >
                  {post.circleName}
                </LinkWithBack>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-gray-400 text-xs">{formatDate(post.createdAt)}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                post.visibility === 'public' ? 'bg-green-50 text-green-600'
                : post.visibility === 'followers' ? 'bg-yellow-50 text-yellow-600'
                : 'bg-red-50 text-red-600'
              }`}>
                {post.visibility === 'public' ? '公开' : post.visibility === 'followers' ? '关注者' : '私密'}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                isArticle ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
              }`}>
                {isArticle ? '文章' : '动态'}
              </span>
            </div>
          </div>

          {/* More menu */}
          <div className="relative flex-shrink-0" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
              </svg>
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[150px] z-10">
                {isAuthenticated && String(user?.id) === String(post.author.id) ? (
                  <>
                    <div
                      className="relative px-4 py-2 text-left text-sm hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                      onMouseEnter={() => setShowVisibilityMenu(true)}
                      onMouseLeave={() => setShowVisibilityMenu(false)}
                    >
                      <span>修改可见性</span>
                      <span className="text-gray-400">▸</span>
                      {showVisibilityMenu && (
                        <div className="absolute left-full top-0 ml-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[180px] z-20">
                          <button onClick={() => { handleChangeVisibility('public'); setShowMenu(false); setShowVisibilityMenu(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">🌐 公开</button>
                          <button onClick={() => { handleChangeVisibility('followers'); setShowMenu(false); setShowVisibilityMenu(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">👥 仅关注者</button>
                          <button onClick={() => { handleChangeVisibility('private'); setShowMenu(false); setShowVisibilityMenu(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">🔒 私密</button>
                        </div>
                      )}
                    </div>
                    <button onClick={handleDelete} className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600">
                      删除
                    </button>
                  </>
                ) : (
                  <button onClick={() => { setShowReportModal(true); setShowMenu(false); }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600">
                    举报
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="px-5 pb-3">
          {/* Title for articles */}
          {isArticle && post.title && (
            <h1 className="text-[18px] font-bold text-gray-900 leading-snug mb-2">{post.title}</h1>
          )}

          {/* Body */}
          {isRepostContent ? (
            <div className="mb-3 p-3 bg-gray-50 border border-gray-100 rounded-xl">
              <div className="text-xs text-gray-400 mb-1.5">转发内容</div>
              {hasOriginalLink ? (
                <>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {post.content.split('\n原文链接:')[0]!
                      .replace('转发文章\n「', '').replace('」', '')
                      .replace('转发动态\n「', '').replace('」', '')
                      .trim()}
                  </p>
                  <LinkWithBack
                    href={post.content.match(/原文链接: (.*)/)?.[1]?.trim() || '#'}
                    className="text-[#6364FF] text-xs font-medium mt-2 inline-flex items-center gap-1 hover:underline"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    查看原文
                  </LinkWithBack>
                </>
              ) : (
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {post.content.replace('转发文章\n「', '').replace('」', '').replace('转发动态\n「', '').replace('」', '').trim()}
                </p>
              )}
            </div>
          ) : isArticle ? (
            <div className="content-prose text-gray-700 leading-relaxed text-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {post.content}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>
          )}

          {/* Media */}
          {mediaUrl && (
            <div className="mb-3 rounded-xl overflow-hidden bg-gray-100">
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mediaUrl} alt="media" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
              </div>
            </div>
          )}

          {/* Tags */}
          {post.tags && Array.isArray(post.tags) && post.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mt-2">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/topic/${encodeURIComponent(String(tag))}`}
                  className="text-[#6364FF] hover:bg-[#F0EFFF] px-2 py-0.5 rounded-full text-xs font-medium transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── Action bar ── */}
        <div className="flex items-center justify-around px-2 py-2.5 border-t border-gray-50 text-gray-500">
          {/* Like */}
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
              isLiked ? 'text-red-500 bg-red-50' : 'hover:text-red-500 hover:bg-red-50'
            }`}
          >
            <svg
              className={`w-5 h-5 transition-transform duration-200 ${isLiked ? 'fill-current' : ''} ${heartBounce ? 'scale-125' : ''}`}
              fill={isLiked ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>{formatNumber(likes)}</span>
          </button>

          {/* Comment */}
          <button
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:text-[#6364FF] hover:bg-[#F0EFFF] transition-all duration-200 text-sm font-medium"
            onClick={() => document.getElementById('comment-section')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>{formatNumber(post.comments)}</span>
          </button>

          {/* Repost */}
          {!isRepostContent && (
            <div className="relative" ref={shareRef}>
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:text-green-600 hover:bg-green-50 transition-all duration-200 text-sm font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span>{formatNumber(shares)}</span>
              </button>
              {showShareOptions && (
                <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[160px] z-10">
                  <button onClick={handleShareToMoment} className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2">
                    <span>📝</span> 转发到动态
                  </button>
                  <button onClick={handleShareToFriend} className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2">
                    <span>👥</span> 复制链接给好友
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Collect */}
          <button
            onClick={handleCollect}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
              isCollected ? 'text-yellow-500 bg-yellow-50' : 'hover:text-yellow-600 hover:bg-yellow-50'
            }`}
          >
            <svg
              className={`w-5 h-5 ${isCollected ? 'fill-current' : ''}`}
              fill={isCollected ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
        </div>
      </Card>

      {/* ── Comment section ── */}
      <Card className="border-gray-200 shadow-sm" id="comment-section">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">评论 ({formatNumber(post.comments)})</h2>
          </div>

          {isAuthenticated && (
            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="写下你的评论..."
                rows={3}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#6364FF] focus:ring-2 focus:ring-[#6364FF]/20 resize-none text-sm transition-all duration-200"
              />
              <div className="flex justify-end mt-3">
                <Button variant="primary" onClick={handleCommentSubmit}
                  disabled={!newComment.trim() || submittingComment} isLoading={submittingComment}>
                  发表评论
                </Button>
              </div>
            </div>
          )}

          {commentsLoading ? (
            <div className="text-center py-6">
              <div className="inline-block animate-spin h-5 w-5 border-2 border-[#6364FF] border-t-transparent rounded-full" />
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-4 divide-y divide-gray-100">
              {comments.map((comment) => (
                <div key={comment.id} className="pt-4 first:pt-0 last:pb-0 pb-4">
                  <div className="flex gap-3">
                    <Avatar src={getIPFSUrl(comment.author.avatarCid)} name={comment.author.nickname || comment.author.username} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <LinkWithBack href={`/profile/${comment.author.username}`}
                            className="font-semibold text-gray-900 text-sm hover:text-[#6364FF] transition-colors truncate">
                            {comment.author.nickname && comment.author.nickname !== comment.author.username ? comment.author.nickname : ''}
                          </LinkWithBack>
                          <span className="text-gray-400 text-xs">@{comment.author.username}</span>
                        </div>
                        <span className="text-gray-400 text-xs shrink-0">{formatDate(comment.createdAt)}</span>
                      </div>
                      <p className="text-gray-700 mt-1.5 text-sm leading-relaxed">{comment.content}</p>
                      <button
                        onClick={() => setReplyingTo(replyingTo?.id === comment.id ? null : comment)}
                        className="text-sm text-[#6364FF] hover:text-[#5558DD] mt-2 font-medium transition-colors"
                      >
                        回复
                      </button>

                      {replyingTo?.id === comment.id && (
                        <div className="mt-3 pl-3 border-l-2 border-[#6364FF]/20">
                          <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder={`回复 ${comment.author.nickname || comment.author.username}...`}
                            rows={2}
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#6364FF] focus:ring-2 focus:ring-[#6364FF]/20 resize-none text-sm transition-all duration-200"
                          />
                          <div className="flex justify-end gap-2 mt-2">
                            <button onClick={() => { setReplyingTo(null); setReplyContent(''); }}
                              className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                              取消
                            </button>
                            <Button variant="primary" size="sm" onClick={() => handleReplySubmit(comment.id, 'comment')}
                              disabled={!replyContent.trim()}>
                              发送
                            </Button>
                          </div>
                        </div>
                      )}

                      {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-3 space-y-3 pl-2">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="flex gap-2.5 pt-3 border-t border-gray-50">
                              <Avatar src={getIPFSUrl(reply.author.avatarCid)} name={reply.author.nickname || reply.author.username} size="xs" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 text-sm">
                                  <LinkWithBack href={`/profile/${reply.author.username}`}
                                    className="font-medium text-gray-900 hover:text-[#6364FF] transition-colors truncate">
                                    {reply.author.nickname && reply.author.nickname !== reply.author.username ? reply.author.nickname : ''}
                                  </LinkWithBack>
                                  {reply.replyTo && (
                                    <>
                                      <span className="text-gray-400 text-xs">回复</span>
                                      <span className="text-[#6364FF] text-xs truncate max-w-[120px]">
                                        @{reply.replyTo.author.nickname && reply.replyTo.author.nickname !== reply.replyTo.author.username ? reply.replyTo.author.nickname : reply.replyTo.author.username}
                                      </span>
                                    </>
                                  )}
                                  <span className="text-gray-400 text-xs shrink-0">{formatDate(reply.createdAt)}</span>
                                </div>
                                <p className="text-gray-700 text-sm mt-1 leading-relaxed">{reply.content}</p>
                                <button
                                  onClick={() => setReplyingTo(replyingTo?.id === reply.id ? null : reply)}
                                  className="text-xs text-[#6364FF] hover:text-[#5558DD] mt-1.5 font-medium transition-colors"
                                >
                                  回复
                                </button>

                                {replyingTo?.id === reply.id && (
                                  <div className="mt-2 pl-2 border-l-2 border-[#6364FF]/20">
                                    <textarea
                                      value={replyContent}
                                      onChange={(e) => setReplyContent(e.target.value)}
                                      placeholder={`回复 ${reply.author.nickname || reply.author.username}...`}
                                      rows={2}
                                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#6364FF] focus:ring-2 focus:ring-[#6364FF]/20 resize-none text-xs transition-all duration-200"
                                    />
                                    <div className="flex justify-end gap-2 mt-2">
                                      <button onClick={() => { setReplyingTo(null); setReplyContent(''); }}
                                        className="px-2.5 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                                        取消
                                      </button>
                                      <Button variant="primary" size="sm" onClick={() => handleReplySubmit(reply.id, 'reply')}
                                        disabled={!replyContent.trim()}>
                                        发送
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-gray-500 font-medium">暂无评论</p>
              <p className="text-gray-400 text-sm mt-1">快来发表第一条评论吧！</p>
            </div>
          )}
        </div>
      </Card>

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        type={isArticle ? 'article' : 'moment'}
        targetId={Number(post.id)}
      />
    </div>
  );
}
