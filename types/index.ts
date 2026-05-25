// 统一类型定义 — 基于 Prisma schema
// 领域类型 (Domain types): id 为 number，匹配数据库
// 传输类型 (DTO types):   id 为 string，匹配 JSON 序列化后的 API 响应

// ==================== 基础类型 ====================

export type PostType = 'article' | 'moment';
export type Visibility = 'public' | 'followers' | 'private';
export type ReportStatus = 'pending' | 'processing' | 'resolved' | 'rejected';
export type NotificationType = 'like' | 'comment' | 'follow' | 'mention' | 'system';

// ==================== 用户 ====================

export interface User {
  id: number;
  username: string;
  nickname?: string | null;
  avatarCid?: string | null;
  bio?: string | null;
  isAdmin: boolean;
  isFrozen: boolean;
  createdAt: string;
  updatedAt: string;
  allowFollow: boolean;
  allowMessage: boolean;
  hideFollowers: boolean;
  hideFollowing: boolean;
  hideLikes: boolean;
  hideCollections: boolean;
  backgroundCid?: string | null;
  backgroundColor: string;
  globalBackgroundCid?: string | null;
  globalBackgroundColor: string;
}

export interface UserProfile extends Partial<User> {
  id: number;
  username: string;
  followerCount?: number;
  followingCount?: number;
  postCount?: number;
  articleCount?: number;
  momentCount?: number;
  isFollowing?: boolean;
  isBlocked?: boolean;
}

export interface UserStats {
  id: number;
  username: string;
  followerCount: number;
  followingCount: number;
  postCount: number;
  articleCount: number;
  hideFollowing: boolean;
  hideFollowers: boolean;
}

export interface UserPreferences {
  language?: string;
  fontSize?: string;
  colorScheme?: string;
  defaultVisibility?: string;
}

// API 传输格式 — JSON 序列化后 id 为 string，偏好字段扁平化在 User 对象上
export interface UserDTO {
  id: string;
  username: string;
  nickname?: string | null;
  avatar?: string;
  avatarCid?: string | null;
  bio?: string | null;
  isAdmin?: boolean;
  isFrozen?: boolean;
  createdAt?: string;
  updatedAt?: string;
  allowFollow?: boolean;
  allowMessage?: boolean;
  hideFollowers?: boolean;
  hideFollowing?: boolean;
  hideLikes?: boolean;
  hideCollections?: boolean;
  backgroundCid?: string | null;
  backgroundColor?: string;
  globalBackgroundCid?: string | null;
  globalBackgroundColor?: string;
  language?: string;
  fontSize?: string;
  colorScheme?: string;
  defaultVisibility?: string;
}

// ==================== 作者 / 发件人 ====================

export interface PostAuthor {
  id: number;
  username: string;
  nickname?: string;
  avatarCid?: string | null;
}

export interface PostCircle {
  id: number;
  name: string;
}

export interface MessageSender {
  id: number;
  username: string;
  avatarCid?: string | null;
}

export interface NotificationUser {
  id: number;
  username: string;
  avatarCid?: string | null;
}

// ==================== 帖子 / 文章 / 动态 ====================

export interface Post {
  id: number;
  type: PostType;
  content: string;
  visibility: Visibility;
  author: PostAuthor;
  likes: number;
  comments: number;
  isLiked?: boolean;
  isCollected?: boolean;
  createdAt: string;
  updatedAt?: string;
  mediaCid?: string | null;
  mediaUrl?: string;
  circleId?: number | null;
  circle?: PostCircle | null;
  title?: string;
  tags?: string[];
}

export interface PostDTO {
  id: string;
  type: PostType;
  title?: string;
  content: string;
  mediaUrl?: string;
  mediaCid?: string;
  likes: number;
  comments: number;
  shares?: number;
  visibility: Visibility;
  createdAt: string;
  updatedAt?: string;
  tags?: string[];
  circleId?: number;
  circleName?: string;
  author?: {
    id: string;
    username: string;
    avatar?: string;
    avatarCid?: string;
    nickname?: string;
  };
  isLiked?: boolean;
  isCollected?: boolean;
  isSaved?: boolean;
}

export interface Article {
  id: number;
  title: string;
  content: string;
  coverCid?: string | null;
  mediaCid?: string | null;
  tags?: string | null;
  visibility: Visibility;
  authorId: number;
  circleId?: number | null;
  createdAt: string;
  updatedAt: string;
  author: PostAuthor;
  circle?: PostCircle | null;
  likes: number;
  comments: number;
  isLiked?: boolean;
  isCollected?: boolean;
}

export interface Moment {
  id: number;
  content: string;
  mediaCid?: string | null;
  visibility: Visibility;
  authorId: number;
  createdAt: string;
  updatedAt: string;
  author: PostAuthor;
  likes: number;
  comments: number;
  isLiked?: boolean;
  isCollected?: boolean;
}

// ==================== 评论 ====================

export interface ArticleComment {
  id: number;
  articleId: number;
  content: string;
  createdAt: string;
  authorId: number;
  replyToId?: number | null;
  author: PostAuthor;
}

export interface MomentComment {
  id: number;
  momentId: number;
  content: string;
  createdAt: string;
  authorId: number;
  replyToId?: number | null;
  author: PostAuthor;
}

export interface Comment {
  id: string;
  author: PostAuthor;
  content: string;
  createdAt: string;
  likes: number;
  replies?: Comment[];
}

// ==================== 消息 ====================

export interface Message {
  id: number;
  content: string;
  mediaCid?: string | null;
  isRead: boolean;
  senderId: number;
  receiverId: number;
  createdAt: string;
  sender: MessageSender;
}

export interface MessageDTO {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  isRead: boolean;
  createdAt: string;
  sender?: MessageSender;
  receiver?: UserDTO;
}

export interface Conversation {
  userId: number;
  user: MessageSender;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

// ==================== 通知 ====================

export interface Notification {
  id: number;
  type: NotificationType;
  userId: number;
  fromUserId?: number | null;
  articleId?: number | null;
  momentId?: number | null;
  commentId?: number | null;
  content?: string | null;
  isRead: boolean;
  createdAt: string;
  user: NotificationUser;
  postContent?: string | null;
}

export interface NotificationDTO {
  id: string;
  type: NotificationType;
  content: string;
  from?: NotificationUser;
  read: boolean;
  createdAt: string;
  link?: string;
}

// ==================== 圈子 ====================

export interface Circle {
  id: number;
  name: string;
  description?: string | null;
  avatarCid?: string | null;
  category: string;
  creatorId: number;
  adminIds?: string | null;
  createdAt: string;
  updatedAt: string;
  creator?: PostAuthor;
  memberCount?: number;
  postCount?: number;
  isMember?: boolean;
}

export interface CircleDTO {
  id: string;
  name: string;
  description?: string;
  avatarCid?: string;
  avatar?: string;
  category: string;
  creatorId: string;
  creator?: UserDTO;
  memberCount: number;
  postCount: number;
  createdAt: string;
  isMember?: boolean;
}

export interface CircleMember {
  id: number;
  circleId: number;
  userId: number;
  createdAt: string;
  user: PostAuthor;
}

// ==================== 社交 ====================

export interface UserFollows {
  id: number;
  followerId: number;
  followingId: number;
  createdAt: string;
}

// ==================== 举报 ====================

export interface Report {
  id: number;
  reason: string;
  description?: string | null;
  reporterId: number;
  targetId: number;
  type: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
}

// ==================== 收藏 & 点赞 ====================

export interface ArticleCollection {
  id: number;
  articleId: number;
  userId: number;
  createdAt: string;
  article?: Article;
}

export interface MomentCollection {
  id: number;
  momentId: number;
  userId: number;
  createdAt: string;
  moment?: Moment;
}

export interface ArticleLike {
  id: number;
  articleId: number;
  userId: number;
  createdAt: string;
}

export interface MomentLike {
  id: number;
  momentId: number;
  userId: number;
  createdAt: string;
}

// ==================== 工具类型 ====================

export type Cid = string & { readonly __brand: 'Cid' };
export type UserId = number & { readonly __brand: 'UserId' };

// ==================== API 响应类型 ====================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  take: number;
}
