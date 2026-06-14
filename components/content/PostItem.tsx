/**
 * 帖子展示组件（PostItem Component）
 *
 * 文件功能说明：
 * - 统一渲染文章(Article)和动态(Moment)两种内容类型
 * - 提供完整的社交互动功能（点赞、评论、转发、收藏、举报）
 * - 支持可见性控制（公开、关注者、私密）
 * - 实现转发功能的多种模式（转发到动态、转发给好友）
 * - 响应式设计，适配不同屏幕尺寸
 *
 * 组件架构：
 * ┌─────────────────────────────────────────────────────┐
 * │ PostItem (主容器)                                   │
 * ├─────────────────────────────────────────────────────┤
 * │ Header (头部)                                       │
 * │   ├── Avatar (用户头像)                             │
 * │   ├── UserInfo (用户信息：昵称、用户名、时间)       │
 * │   └── Menu (操作菜单：更多选项、可见性设置)         │
 * ├─────────────────────────────────────────────────────┤
 * │ Content (内容区)                                    │
 * │   ├── Title (文章标题，仅文章类型)                  │
 * │   ├── Body (正文内容)                              │
 * │   ├── Media (媒体文件：图片/视频)                   │
 * │   └── Tags (话题标签)                              │
 * ├─────────────────────────────────────────────────────┤
 * │ Actions (互动栏)                                    │
 * │   ├── LikeButton (点赞按钮)                        │
 * │   ├── CommentButton (评论按钮)                     │
 * │   ├── ShareButton (分享/转发按钮)                  │
 * │   └── CollectButton (收藏按钮)                     │
 * ├─────────────────────────────────────────────────────┤
 * │ Modals (弹窗层)                                     │
 * │   ├── ReportModal (举报弹窗)                       │
 * │   ├── ShareOptions (分享选项菜单)                  │
 * │   └── VisibilityMenu (可见性设置菜单)              │
 * └─────────────────────────────────────────────────────┘
 *
 * 状态管理：
 * - isLiked: 当前用户是否已点赞（本地状态）
 * - isCollected: 当前用户是否已收藏（本地状态）
 * - likes: 点赞计数（可实时更新）
 * - shares: 转发计数（可实时更新）
 * - showMenu/showShareOptions: UI状态控制
 *
 * 事件处理：
 * - onLike: 点赞事件回调（通知父组件更新）
 * - onDelete: 删除事件回调（需确认）
 * - onShare: 转发事件回调（更新转发计数）
 *
 * 技术特点：
 * - 使用'use client'指令启用客户端渲染
 * - 集成useAuth钩子获取认证状态
 * - 使用useRef管理DOM引用和点击外部关闭
 * - 支持IPFS媒体文件显示
 * - 剪贴板API实现链接复制（带降级方案）
 *
 * @module PostItem
 * @version 3.0.0
 * @requires React Hooks (useState, useEffect, useRef)
 * @requires useAuth 认证上下文
 * @requires IPFS 媒体服务
 */

//帖子项目组件 - 支持文章(Article)和动态(Moment)两种类型
// 帖子(Post) = 文章(Article) + 动态(Moment)
// - 文章：可关联圈子、可关联话题、出现在首页/搜索/个人主页、支持可见度
// - 动态：不可关联圈子、可关联话题、仅出现在个人主页、支持可见度

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LinkWithBack from '@/components/common/LinkWithBack';
import { formatDate, formatNumber } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { memo, useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import ReportModal from '@/components/common/ReportModal';
import type { PostDTO, Visibility, PostType } from '@/types';
import { toast } from '@/lib/toast';
import { getIPFSUrl } from '@/lib/ipfs';
export type { PostDTO as Post, Visibility, PostType } from '@/types';

function stripMarkdown(text: string): string {
  if (!text) return '';
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^#{1,6}\s/gm, '')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1');
}

type Post = PostDTO;

/**
 * PostItem组件属性接口
 *
 * @interface PostItemProps
 * @description 定义组件接收的props类型
 *
 * @property {Post} post - 要显示的帖子数据
 * @property {Function} [onLike] - 点赞回调函数
 *   @param {string} postId - 帖子ID
 * @property {Function} [onDelete] - 删除回调函数
 *   @param {string} postId - 帖子ID
 * @property {Function} [onShare] - 分享/转发回调函数
 *   @param {string} postId - 帖子ID
 *   @param {number} newShares - 更新后的转发数
 */
interface PostItemProps {
  post: Post;
  onLike?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onShare?: (postId: string, newShares: number) => void;
}

/**
 * PostItem主组件
 *
 * @function PostItem
 * @param {PostItemProps} props - 组件属性
 * @returns {JSX.Element} 渲染的帖子UI
 *
 * @description 这是整个应用中最核心的内容展示组件，
 * 在首页、个人主页、搜索结果、收藏列表等多个页面复用。
 *
 * @example
 * // 基础用法
 * <PostItem post={postData} />
 *
 * // 带事件处理
 * <PostItem
 *   post={postData}
 *   onLike={handleLike}
 *   onDelete={handleDelete}
 *   onShare={handleShare}
 * />
 */
const PostItem = memo(function PostItem({ post, onLike, onDelete, onShare }: PostItemProps) {
  /**
   * 获取认证状态和当前用户信息
   *
   * @constant {Object} isAuthenticated - 是否已登录
   * @constant {Object} user - 当前用户对象
   */
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  /**
   * 本地状态管理
   *
   * @state {boolean} isLiked - 当前用户是否已点赞此帖子
   * @state {boolean} isCollected - 当前用户是否已收藏此帖子
   * @state {number} likes - 当前点赞数（可实时更新）
   * @state {number} shares - 当前转发数（可实时更新）
   * @state {boolean} showReportModal - 是否显示举报弹窗
   * @state {boolean} showMenu - 是否显示更多选项菜单
   * @state {boolean} showVisibilityMenu - 是否显示可见性设置菜单
   * @state {boolean} showShareOptions - 是否显示分享选项菜单
   */
  const [isLiked, setIsLiked] = useState(false);
  const [isCollected, setIsCollected] = useState(false);
  const [likes, setLikes] = useState(post?.likes || 0);
  const [shares, setShares] = useState(post?.shares || 0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);

  /**
   * DOM引用（用于点击外部关闭功能）
   *
   * @ref {HTMLDivElement} menuRef - 菜单容器的DOM引用
   * @ref {HTMLDivElement} shareRef - 分享选项容器的DOM引用
   */
  const menuRef = useRef<HTMLDivElement>(null);
  const shareRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
        setShowVisibilityMenu(false);
      }
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShowShareOptions(false);
      }
    };
    if (showMenu || showShareOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu, showShareOptions]);

  const postId = post?.id;
  const isArticle = post?.type === 'article';
  const isMoment = post?.type === 'moment';

  useEffect(() => {
    const checkLikeAndCollect = async () => {
      if (!isAuthenticated || !user || !postId) return;
      
      try {
        const token = localStorage.getItem('token');
        const basePath = isArticle ? '/content/articles' : '/content/moments';

        const likeResponse = await fetch(`/api${basePath}/${postId}/is-liked`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (likeResponse.ok) {
          const likeData = await likeResponse.json();
          setIsLiked(likeData.isLiked);
        }

        const collectResponse = await fetch(`/api${basePath}/${postId}/is-collected`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (collectResponse.ok) {
          const collectData = await collectResponse.json();
          setIsCollected(collectData.isCollected);
        }
      } catch (err) {
        console.error('检查点赞和收藏状态失败:', err);
      }
    };

    checkLikeAndCollect();
  }, [isAuthenticated, user, postId, isArticle]);

  if (!post || !post.author) {
    return null;
  }

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.info('请先登录');
      return;
    }

    try {
      const method = isLiked ? 'DELETE' : 'POST';
      const basePath = isArticle ? '/content/articles' : '/content/moments';
      const response = await fetch(`/api${basePath}/${post.id}/like`, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLikes(data.likes);
        setIsLiked(!isLiked);
        onLike?.(post.id);
      }
    } catch (err) {
      console.error('点赞操作失败:', err);
    }
  };

  const handleCollect = async () => {
    if (!isAuthenticated) {
      toast.info('请先登录');
      return;
    }

    try {
      const method = isCollected ? 'DELETE' : 'POST';
      const basePath = isArticle ? '/content/articles' : '/content/moments';
      const response = await fetch(`/api${basePath}/${post.id}/collect`, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        setIsCollected(!isCollected);
      }
    } catch (err) {
      console.error('收藏操作失败:', err);
    }
  };

  const isRepostMoment = !!(post?.content && (post.content.includes('转发动态') || post.content.includes('转发文章')));
  const hasOriginalLink = !!(post?.content && post.content.includes('原文链接:'));

  const handleShare = () => {
    if (!isAuthenticated) {
      toast.info('请先登录');
      return;
    }
    if (isRepostMoment) {
      toast.warning('转发动态不可再次转发');
      return;
    }
    setShowShareOptions(!showShareOptions);
  };

  const handleShareToMoment = () => {
    if (!isAuthenticated) {
      toast.info('请先登录');
      return;
    }
    setShowShareOptions(false);
    const postUrl = `/content/create/moment?repost=${isArticle ? 'article' : 'moment'}_${post.id}`;
    router.push(postUrl);
  };

  const handleShareToFriend = async () => {
    try {
      const postUrl = `${window.location.origin}/content/${isArticle ? 'article' : 'moment'}/${post.id}`;
      
      try {
        const basePath = isArticle ? '/content/articles' : '/content/moments';
        
        // 使用 count_only 模式，只更新计数器，不创建新动态
        const response = await fetch(`/api${basePath}/${post.id}/repost?action=count_only`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('转发成功，更新后的数据:', data);
          const newShares = data.reposts || data.shares || (shares + 1);
          setShares(newShares);
          if (onShare) onShare(post.id, newShares);
        } else {
          console.warn('更新转发计数器失败，HTTP状态:', response.status);
          const newShares = shares + 1;
          setShares(newShares);
          if (onShare) onShare(post.id, newShares);
        }
      } catch (apiErr) {
        console.error('调用转发接口失败:', apiErr);
        const newShares = shares + 1;
        setShares(newShares);
        if (onShare) onShare(post.id, newShares);
      }
      
      let copySuccess = false;
      
      try {
        await navigator.clipboard.writeText(postUrl);
        copySuccess = true;
      } catch (clipboardErr) {
        console.warn('Clipboard API failed, using fallback:', clipboardErr);
        
        const textArea = document.createElement('textarea');
        textArea.value = postUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
          copySuccess = true;
        } catch (execErr) {
          console.error('Fallback copy also failed:', execErr);
        }
        
        document.body.removeChild(textArea);
      }
      
      setShowShareOptions(false);
      
      if (copySuccess) {
        toast.success('链接已复制到剪贴板');
      } else {
        toast.warning('链接复制失败，但转发计数已更新');
      }
    } catch (err) {
      console.error('转发操作失败:', err);
      toast.error('转发失败，请重试');
    }
  };

  const handleChangeVisibility = async (newVisibility: Visibility) => {
    if (!isAuthenticated) {
      toast.info('请先登录');
      return;
    }

    try {
      const basePath = isArticle ? '/content/articles' : '/content/moments';
      const response = await fetch(`/api${basePath}/${post.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ visibility: newVisibility }),
      });

      if (response.ok) {
        setShowVisibilityMenu(false);
        router.refresh();
      }
    } catch (err) {
      console.error('修改可见性失败:', err);
      toast.error('修改可见性失败，请重试');
    }
  };

  const getVisibilityLabel = (visibility: Visibility) => {
    switch (visibility) {
      case 'public': return '🌐 公开可见';
      case 'followers': return '👥 仅关注者';
      case 'private': return '🔒 私密';
      default: return '🌐 公开可见';
    }
  };

  const [contentExpanded, setContentExpanded] = useState(false);

  const displayName = post.author.nickname || post.author.username || '未知用户';

  return (
    <Card hoverable className="mb-4 overflow-hidden">
      {/* ═══ 头部：头像 + 用户名·昵称 + 圈子标签 + 发布时间 + 可见度 ═══ */}
      <div className="flex items-center gap-3 px-3 sm:px-5 pt-5 pb-3">
        <LinkWithBack
          href={`/profile/${post.author.username}`}
          className="flex-shrink-0"
        >
          <Avatar
            src={post.author.avatar}
            alt={displayName}
            size="md"
          />
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
              post.visibility === 'public'
                ? 'bg-green-50 text-green-600'
                : post.visibility === 'followers'
                  ? 'bg-yellow-50 text-yellow-600'
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

        {/* 更多操作菜单 */}
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            onClick={() => { setShowMenu(!showMenu); setShowVisibilityMenu(false); }}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
            </svg>
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[150px] z-10 animate-scaleIn origin-top-right">
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
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!window.confirm(`确定要删除这篇${isArticle ? '文章' : '动态'}吗？`)) return;
                      try {
                        const basePath = isArticle ? '/content/articles' : '/content/moments';
                        const response = await fetch(`/api${basePath}/${post.id}`, {
                          method: 'DELETE',
                          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                        });
                        if (response.ok) { onDelete?.(post.id); setShowMenu(false); router.refresh(); }
                        else { const error = await response.json(); toast.error(error.message || '删除失败'); }
                      } catch { toast.error('删除失败，请重试'); }
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600"
                  >
                    删除
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { setShowReportModal(true); setShowMenu(false); }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600"
                >
                  举报
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══ 中部：标题 + 正文 + 媒体 + 标签 ═══ */}
      <div className="px-3 sm:px-5 pb-3">
        {/* 标题 (18px bold) */}
        {isArticle && post.title && (
          <LinkWithBack href={`/content/article/${post.id}`} className="block group mb-2">
            <h3 className="text-[18px] font-bold text-gray-900 group-hover:text-[#6364FF] transition-colors leading-snug">
              {post.title}
            </h3>
          </LinkWithBack>
        )}

        {/* 正文 (14px, 三行截断 + 展开) */}
        {isRepostMoment ? (
          <div className="mb-3 p-3 bg-gray-50 border border-gray-100 rounded-xl">
            <div className="text-xs text-gray-400 mb-1.5">转发内容</div>
            <LinkWithBack
              href={(() => {
                const rawUrl = post.content.match(/原文链接: (.*)/)?.[1]?.trim();
                if (!rawUrl) return '#';
                // Handle both absolute (http...) and relative (/content/...) URLs
                return rawUrl.startsWith('http') ? rawUrl : rawUrl;
              })()}
              className="block"
            >
              <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">
                {post.content.replace(/转发(文章|动态)\n「/, '').replace(/」/g, '').replace(/\n原文链接:.*/, '').trim()}
              </p>
            </LinkWithBack>
          </div>
        ) : (
          <LinkWithBack href={`/content/${isArticle ? 'article' : 'moment'}/${post.id}`} className="block group mb-2">
            <p className={`text-sm text-gray-700 leading-relaxed break-words group-hover:text-gray-900 transition-colors ${contentExpanded ? '' : 'line-clamp-3'}`}>
              {stripMarkdown(post.content)}
            </p>
            {post.content && post.content.length > 200 && (
              <button
                onClick={(e) => { e.preventDefault(); setContentExpanded(!contentExpanded); }}
                className="text-[#6364FF] text-xs font-medium mt-1 hover:underline"
              >
                {contentExpanded ? '收起' : '展开全文'}
              </button>
            )}
          </LinkWithBack>
        )}

        {/* 媒体 (16:9 自适应) */}
        {(post.mediaUrl || post.mediaCid) && (
          <div className="mb-3 rounded-xl overflow-hidden bg-gray-100">
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.mediaUrl || getIPFSUrl(post.mediaCid) || ''}
                alt="media"
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        )}

        {/* 标签 */}
        {post.tags && Array.isArray(post.tags) && post.tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mt-2">
            {post.tags.map((tag: string | number) => (
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

      {/* ═══ 底部：交互按钮等宽分布 ═══ */}
      <div className="flex items-center justify-around px-2 py-2.5 border-t border-gray-50 text-gray-500">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
            isLiked ? 'text-red-500 bg-red-50' : 'hover:text-red-500 hover:bg-red-50'
          }`}
        >
          <svg className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span>{formatNumber(likes)}</span>
        </button>

        <LinkWithBack
          href={`/content/${isArticle ? 'article' : 'moment'}/${post.id}`}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:text-[#6364FF] hover:bg-[#F0EFFF] transition-all duration-200 text-sm font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>{formatNumber(post.comments)}</span>
        </LinkWithBack>

        {!isRepostMoment && (
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
              <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[160px] z-10 animate-scaleIn origin-bottom-left">
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

        <button
          onClick={handleCollect}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
            isCollected ? 'text-yellow-500 bg-yellow-50' : 'hover:text-yellow-600 hover:bg-yellow-50'
          }`}
        >
          <svg className={`w-5 h-5 ${isCollected ? 'fill-current' : ''}`} fill={isCollected ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </button>
      </div>

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        type={isArticle ? 'article' : 'moment'}
        targetId={Number(post.id)}
      />
    </Card>
  );
});

export default PostItem;
