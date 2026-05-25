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
import { UserDisplayWithAvatar } from '@/components/common/UserDisplay';

import type { PostDTO, Visibility, PostType } from '@/types';
import { toast } from '@/lib/toast';
export type { PostDTO as Post, Visibility, PostType } from '@/types';

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

  return (
    <Card hoverable className="mb-4 p-5">
      <div className="flex gap-4">
          <UserDisplayWithAvatar
            avatar={post.author.avatar}
            nickname={post.author.nickname}
            username={post.author.username}
            avatarSize="md"
            size="md"
            layout="stack"
            gap="sm"
            className="flex"
          />

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center flex-wrap gap-1">
                {isArticle && post.circleId && post.circleName && (
                  <>
                    <span className="text-gray-300">·</span>
                    <LinkWithBack href={`/circles/${post.circleId}`} className="text-[#6364FF] hover:underline text-sm font-medium">
                      📍 {post.circleName}
                    </LinkWithBack>
                  </>
                )}
                <span className="text-gray-400 text-sm">·</span>
                <span className="text-gray-500 text-sm">{formatDate(post.createdAt)}</span>
              </div>
            <div className="flex items-center gap-2">
              {isAuthenticated && String(user?.id) === String(post.author.id) && (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => { setShowMenu(!showMenu); setShowVisibilityMenu(false); }}
                    className="text-gray-400 hover:text-gray-600 px-2"
                  >
                    ⋯
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[150px] z-10">
                      <div
                        className="relative px-4 py-2 text-left text-sm hover:bg-gray-100 cursor-pointer"
                        onMouseEnter={() => setShowVisibilityMenu(true)}
                        onMouseLeave={() => setShowVisibilityMenu(false)}
                      >
                        <span>修改可见性 ▸</span>
                        {showVisibilityMenu && (
                          <div className="absolute left-full top-0 ml-0 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[180px] z-20">
                            <button
                              onClick={() => { handleChangeVisibility('public'); setShowMenu(false); setShowVisibilityMenu(false); }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                            >
                              🌐 公开 - 所有人可见
                            </button>
                            <button
                              onClick={() => { handleChangeVisibility('followers'); setShowMenu(false); setShowVisibilityMenu(false); }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                            >
                              👥 仅关注者 - 仅粉丝可见
                            </button>
                            <button
                              onClick={() => { handleChangeVisibility('private'); setShowMenu(false); setShowVisibilityMenu(false); }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                            >
                              🔒 私密 - 仅自己可见
                            </button>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const confirmed = window.confirm(`确定要删除这篇${isArticle ? '文章' : '动态'}吗？此操作不可撤销。`);
                          if (!confirmed) return;
                          
                          try {
                            const basePath = isArticle ? '/content/articles' : '/content/moments';
                            const token = localStorage.getItem('token');
                            
                            const response = await fetch(`/api${basePath}/${post.id}`, {
                              method: 'DELETE',
                              headers: {
                                'Authorization': `Bearer ${token}`,
                              },
                            });
                            
                            if (response.ok) {
                              onDelete?.(post.id);
                              setShowMenu(false);
                              router.refresh();
                            } else {
                              const error = await response.json();
                              toast.error(error.message || '删除失败');
                            }
                          } catch (err) {
                            console.error('删除失败:', err);
                            toast.error('删除失败，请重试');
                          }
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-600"
                      >
                        删除{isArticle ? '文章' : '动态'}
                      </button>
                    </div>
                  )}
                </div>
              )}
              {isAuthenticated && String(user?.id) !== String(post.author.id) && (
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="text-gray-400 hover:text-gray-600 px-2"
                  >
                    ⋯
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px] z-10">
                      <button
                        onClick={() => {
                          setShowReportModal(true);
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-600"
                      >
                        举报{isArticle ? '文章' : '动态'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {isArticle && post.title && (
            <LinkWithBack href={`/content/article/${post.id}`} className="block group">
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#6364FF] mb-2 transition-colors duration-200">{post.title}</h3>
            </LinkWithBack>
          )}

          {isRepostMoment ? (
            <div className="mb-4">
              {hasOriginalLink && post.content.split('转发文章')[0]!.split('转发动态')[0]!.trim() && (
                <LinkWithBack href={`/content/moment/${post.id}`} className="block group mb-3">
                  <div className="font-bold text-lg text-gray-900 group-hover:text-[#6364FF] transition-colors duration-200">
                    {post.content.split('转发文章')[0]!.split('转发动态')[0]!.trim()}
                  </div>
                </LinkWithBack>
              )}
              <div className="p-4 bg-white border border-gray-100 rounded-lg">
                <div className="text-sm text-gray-500 mb-2">转发内容</div>
                {hasOriginalLink ? (
                  <LinkWithBack href={post.content.match(/原文链接: (.*)/)?.[1] || '#'} className="block group">
                    <p className="text-gray-700 mb-2 line-clamp-3 group-hover:text-[#6364FF] transition-colors duration-200 leading-relaxed">
                      {post.content.split('\n原文链接:')[0].replace('转发文章\n「', '').replace('」', '').replace('转发动态\n「', '').replace('」', '').replace(post.content.split('转发文章')[0].split('转发动态')[0], '').trim()}
                    </p>
                  </LinkWithBack>
                ) : (
                  <LinkWithBack href={`/content/${isArticle ? 'article' : 'moment'}/${post.id}`} className="block group">
                    <p className="text-gray-700 mb-2 line-clamp-3 group-hover:text-[#6364FF] transition-colors duration-200 leading-relaxed">
                      {post.content.replace('转发文章\n「', '').replace('」', '').replace('转发动态\n「', '').replace('」', '').trim()}
                    </p>
                  </LinkWithBack>
                )}
              </div>
            </div>
          ) : (
            <LinkWithBack href={`/content/${isArticle ? 'article' : 'moment'}/${post.id}`} className="block group">
              <p className="text-gray-700 mb-2 line-clamp-3 group-hover:text-[#6364FF] transition-colors duration-200 leading-relaxed">{post.content}</p>
            </LinkWithBack>
          )}

          {(post.mediaUrl || post.mediaCid) && (
            <div className="mb-3 flex justify-center">
              <div className="rounded-xl overflow-hidden max-w-full shadow-sm hover:shadow-md transition-shadow duration-300">
                <img
                  src={post.mediaUrl || post.mediaCid}
                  alt="media"
                  className="max-h-96 object-contain mx-auto"
                />
              </div>
            </div>
          )}

          {post.tags && Array.isArray(post.tags) && post.tags.length > 0 && (
            <div className="mb-3 flex gap-2 flex-wrap">
              {post.tags.map((tag: string | number) => (
                <Link
                  key={tag}
                  href={`/topic/${encodeURIComponent(String(tag))}`}
                  className="text-[#6364FF] hover:bg-[#F0EFFF] px-2.5 py-1 rounded-full text-sm font-medium transition-all duration-200"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          <div className="flex gap-1 mt-4 pt-4 border-t border-gray-100 text-gray-500">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${isLiked ? 'text-red-500 bg-red-50' : 'hover:text-red-500 hover:bg-red-50'}`}
            >
              <svg className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-sm font-medium">{formatNumber(likes)}</span>
            </button>
            <LinkWithBack href={`/content/${isArticle ? 'article' : 'moment'}/${post.id}`} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:text-[#6364FF] hover:bg-[#F0EFFF] transition-all duration-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-sm font-medium">{formatNumber(post.comments)}</span>
            </LinkWithBack>
            {!isRepostMoment && (
              <div className="relative" ref={shareRef}>
                <button 
                  onClick={handleShare}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:text-green-600 hover:bg-green-50 transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span className="text-sm font-medium">{formatNumber(shares)}</span>
                </button>
                {showShareOptions && (
                  <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[180px] z-10">
                    <button
                      onClick={handleShareToMoment}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      <span>转发到动态</span>
                    </button>
                    <button
                      onClick={handleShareToFriend}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span>转发给好友</span>
                    </button>
                  </div>
                )}
              </div>
            )}
            <button 
              onClick={handleCollect}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${isCollected ? 'text-yellow-500 bg-yellow-50' : 'hover:text-yellow-600 hover:bg-yellow-50'}`}
            >
              <svg className={`w-5 h-5 ${isCollected ? 'fill-current' : ''}`} fill={isCollected ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
          </div>
        </div>
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
