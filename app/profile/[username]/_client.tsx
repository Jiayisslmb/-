/**
 * 用户个人主页 - 动态标签页组件
 *
 * 文件功能说明：
 * - 展示指定用户发布的所有动态(Moment)内容
 * - 支持动态的查看、删除和转发功能
 * - 区分本人主页与他人主页（权限控制）
 * - 集成ProfileLayout布局组件保持页面一致性
 *
 * 页面路由：/profile/[username]
 * 路由参数：username - 目标用户的用户名
 *
 * 动态特性说明：
 * - 不可关联圈子（与文章Article不同）
 * - 可关联话题标签
 * - 仅出现在个人主页动态列表
 * - 支持三种可见性：public/followers/private
 *
 * 核心功能模块：
 * ┌─────────────────────────────────────────────────────┐
 * │ 数据获取 (Data Fetching)                            │
 * │   1. 通过用户名查询用户ID                           │
 * │   2. 验证是否为本人主页                             │
 * │   3. 获取该用户的所有动态列表                       │
 * ├─────────────────────────────────────────────────────┤
 * │ 状态管理 (State Management)                         │
 * │   - moments: 动态列表数据                          │
 * │   - userId: 目标用户ID                              │
 * │   - isOwnProfile: 是否为本人的主页                   │
 * ├─────────────────────────────────────────────────────┤
 * │ 事件处理 (Event Handlers)                           │
 * │   - handleDeletePost: 删除动态操作                 │
 * │   - handleSharePost: 更新转发计数                  │
 * └─────────────────────────────────────────────────────┘
 *
 * 技术实现要点：
 * - 使用'use client'指令启用客户端渲染
 * - 通过useParams()获取动态路由参数
 * - 使用localStorage存储认证信息（Token、UserId）
 * - API调用使用fetch原生API，配合async/await模式
 *
 * 权限控制逻辑：
 * - 本人主页：显示删除按钮，允许删除自己的动态
 * - 他人主页：隐藏删除按钮，仅可查看内容
 *
 * @module ProfileDetailPage
 * @version 2.0.0
 * @requires React Hooks (useState, useEffect)
 * @requires Next.js Routing (useParams, Link)
 * @requires PostItem 帖子展示组件
 * @requires ProfileLayout 个人主页布局组件
 */

//个人主页 - 动态标签页
// 展示用户的动态(Moment)内容
// 动态特性：不可关联圈子、可关联话题、仅出现在个人主页、支持可见度

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import LinkWithBack from '@/components/common/LinkWithBack';
import Button from '@/components/ui/Button';
import PostItem from '@/components/content/PostItem';
import ProfileLayout from '@/components/profile/ProfileLayout';
import { getIPFSUrl } from '@/lib/ipfs';

/**
 * API基础URL配置
 *
 * @constant {string} API_URL
 * @description 从环境变量读取后端API地址
 * 默认值：http://localhost:3001/api（开发环境）
 *
 * @env NEXT_PUBLIC_API_URL 生产环境应通过此变量配置
 */

/**
 * 动态数据接口定义
 *
 * @interface PostData
 * @description 定义从后端API获取的单条动态数据结构
 *
 * @property {number} id - 动态唯一标识符
 * @property {string} content - 动态正文内容
 * @property {string} [mediaCid] - 媒体文件IPFS CID（可选）
 * @property {string} visibility - 可见性设置 ('public' | 'followers' | 'private')
 * @property {string} createdAt - 创建时间（ISO格式字符串）
 * @property {Object} author - 作者信息对象
 * @property {number} author.id - 作者用户ID
 * @property {string} author.username - 作者用户名
 * @property {string} [author.nickname] - 作者昵称（可选）
 * @property {string} [author.avatarCid] - 作者头像CID（可选）
 * @property {number} likes - 点赞数量
 * @property {number} comments - 评论数量
 * @property {number} shares - 转发数量
 */
interface PostData {
  id: number;
  content: string;
  mediaCid?: string;
  visibility: string;
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
}

/**
 * 用户个人主页主组件
 *
 * @function ProfileDetailPage
 * @returns {JSX.Element} 渲染的个人主页UI
 *
 * @description 这是用户个人主页的核心页面组件，
 * 负责加载和展示指定用户发布的所有动态内容。
 *
 * 组件生命周期：
 * 1. 挂载时：从URL参数获取目标用户名
 * 2. 数据请求：调用API获取用户信息和动态列表
 * 3. 状态更新：将API响应存入本地状态
 * 4. 渲染输出：遍历动态列表渲染PostItem组件
 *
 * @example
 * // 访问路径示例
 * // /profile/john_doe → 展示john_doe的动态
 * // /profile/我的用户名 → 展示当前登录用户的动态
 */
export function ProfileDetailPage() {
  /**
   * 获取URL路由参数
   *
   * @constant {ReadonlyURLSearchParams} params
   * @description 从Next.js Router获取动态路由参数
   * 包含[username]段的实际值
   */
  const params = useParams();

  /**
   * 目标用户名
   *
   * @constant {string} username
   * @description 从路由参数中提取的用户名
   * 用于查询该用户的信息和动态列表
   */
  const username = params.username as string;

  /**
   * 本地状态定义
   *
   * @state {PostData[]} moments - 该用户发布的动态列表
   * @state {number|null} userId - 目标用户的数字ID（初始为null）
   * @state {boolean} isOwnProfile - 是否为当前登录用户的主页
   */
  const [moments, setMoments] = useState<PostData[]>([]);
  const [userId, setUserId] = useState<number | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMoments = async () => {
      try {
        setLoading(true);
        setError(null);
        const userRes = await fetch(`/api/users/username/${username}`);
        if (!userRes.ok) {
          if (userRes.status === 404) {
            setError('该用户不存在或已注销');
          } else {
            setError('加载用户信息失败');
          }
          return;
        }

        const userData = await userRes.json();
        setUserId(userData.id);

        const currentUserId = localStorage.getItem('userId');
        setIsOwnProfile(String(userData.id) === currentUserId);

        const momentsRes = await fetch(`/api/content/moments/user/${userData.id}`);
        if (momentsRes.ok) {
          setMoments(await momentsRes.json());
        }
      } catch (err) {
        console.error('获取动态失败:', err);
        setError('网络错误，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchMoments();
    }
  }, [username]);

  /**
   * 删除动态处理函数
   *
   * @async
   * @function handleDeletePost
   * @param {string} postId - 要删除的动态ID
   * @returns {Promise<void>}
   *
   * @description 执行以下步骤：
   * 1. 发送DELETE请求到后端API
   * 2. 携带Authorization头进行身份验证
   * 3. 如果删除成功，从本地状态中移除该条动态
   * 4. 触发UI自动更新（React状态驱动渲染）
   *
   * @permission 权限要求：
   * - 只有动态作者本人才能删除
   * - 后端会验证Token对应的用户身份
   *
   * @error 错误处理：
   * - 删除失败时仅在控制台输出错误
   * - 不向用户显示错误提示（可优化）
   */
  const handleDeletePost = async (postId: string) => {
    try {
      const response = await fetch(`/api/content/moments/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        // 从状态数组中移除已删除的动态
        setMoments(prev => prev.filter(m => String(m.id) !== postId));
      }
    } catch (err) {
      console.error('删除动态失败:', err);
    }
  };

  /**
   * 更新转发计数处理函数
   *
   * @function handleSharePost
   * @param {string} postId - 被转发的动态ID
   * @param {number} newShares - 更新后的转发总数
   * @returns {void}
   *
   * @description 当用户转发某条动态后，
   * 由PostItem组件回调此函数更新本地的转发计数。
   *
   * 实现原理：
   * - 使用map遍历moments数组
   * - 匹配目标动态ID（注意类型转换：String(m.id) === postId）
   * - 创建新对象更新shares字段（不可变更新模式）
   * - 其他动态保持原样返回
   *
   * @note 为什么需要类型转换？
   * - postId是字符串类型（来自PostItem props）
   * - m.id是数字类型（来自API响应）
   * - 必须统一类型才能正确比较
   */
  const handleSharePost = (postId: string, newShares: number) => {
    setMoments(prev => prev.map(m =>
      String(m.id) === postId
        ? { ...m, shares: newShares }
        : m
    ));
  };

  return (
    <ProfileLayout activeTab="posts">
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6364FF]" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg mb-4">😔</p>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/"><Button variant="primary">返回首页</Button></Link>
        </div>
      ) : moments.length > 0 ? (
        <div className="space-y-4">
          {moments.slice(0, 5).map((moment) => {
            const author = moment.author || {
              id: userId,
              username: username,
              avatarCid: undefined,
            };
            return (
              <PostItem
                key={moment.id}
                post={{
                  id: String(moment.id),
                  author: {
                    id: String(author.id),
                    username: author.username,
                    nickname: author.nickname,
                    avatar: getIPFSUrl(author.avatarCid),
                  },
                  content: moment.content,
                  type: 'moment',
                  mediaUrl: getIPFSUrl(moment.mediaCid),
                  likes: moment.likes || 0,
                  comments: moment.comments || 0,
                  shares: moment.shares || 0,
                  visibility: moment.visibility as 'public' | 'followers',
                  createdAt: moment.createdAt,
                  tags: [],
                }}
                onDelete={isOwnProfile ? handleDeletePost : undefined}
                onShare={handleSharePost}
              />
            );
          })}
          {moments.length > 5 && (
            <div className="text-center pt-4">
              <LinkWithBack href={`/profile/${username}/posts`}>
                <Button variant="secondary">查看全部 {moments.length} 条动态</Button>
              </LinkWithBack>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-gray-600 py-8">
          <p>暂无动态</p>
        </div>
      )}
    </ProfileLayout>
  );
}
