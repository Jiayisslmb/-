// API 请求封装
// 核心概念：帖子(Post) = 文章(Article) + 动态(Moment)
// - 文章：可关联圈子、可关联话题、出现在首页/搜索/个人主页、支持可见度
// - 动态：不可关联圈子、可关联话题、仅出现在个人主页、支持可见度

import type { UserDTO, PostDTO, CircleDTO, MessageDTO, Visibility } from '@/types';
import { request } from './fetch-client';

// ==================== 动态(Moment) API ====================
// 特性：不可关联圈子、可关联话题、仅出现在个人主页、支持可见度

export async function createMoment(data: { content: string; visibility?: Visibility; mediaCid?: string; mediaUrl?: string; tags?: string }) {
  return request<PostDTO>('/content/moments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getMoment(id: string) {
  return request<PostDTO>(`/content/moments/${id}`);
}

export async function getMomentFeed(skip?: number, take?: number) {
  const params = new URLSearchParams();
  if (skip !== undefined) params.append('skip', skip.toString());
  if (take !== undefined) params.append('take', take.toString());
  return request<PostDTO[]>(`/content/moments/feed?${params}`);
}

export async function getUserMoments(userId: string, skip?: number, take?: number) {
  const params = new URLSearchParams();
  if (skip !== undefined) params.append('skip', skip.toString());
  if (take !== undefined) params.append('take', take.toString());
  return request<PostDTO[]>(`/content/moments/user/${userId}?${params}`);
}

export async function updateMoment(id: string, data: Partial<PostDTO>) {
  return request<PostDTO>(`/content/moments/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteMoment(id: string) {
  return request(`/content/moments/${id}`, {
    method: 'DELETE',
  });
}

export async function likeMoment(id: string) {
  return request<{ success: boolean; likes: number }>(`/content/moments/${id}/like`, {
    method: 'POST',
  });
}

export async function unlikeMoment(id: string) {
  return request<{ success: boolean; likes: number }>(`/content/moments/${id}/like`, {
    method: 'DELETE',
  });
}

export async function commentMoment(id: string, content: string, replyToId?: number) {
  return request(`/content/moments/${id}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content, replyToId }),
  });
}

export async function getMomentComments(id: string, skip?: number, take?: number) {
  const params = new URLSearchParams();
  if (skip !== undefined) params.append('skip', skip.toString());
  if (take !== undefined) params.append('take', take.toString());
  return request(`/content/moments/${id}/comments?${params}`);
}

export async function collectMoment(id: string) {
  return request<{ success: boolean; collections: number }>(`/content/moments/${id}/collect`, {
    method: 'POST',
  });
}

export async function uncollectMoment(id: string) {
  return request<{ success: boolean; collections: number }>(`/content/moments/${id}/collect`, {
    method: 'DELETE',
  });
}

export async function isMomentLiked(id: string) {
  return request<{ isLiked: boolean }>(`/content/moments/${id}/is-liked`);
}

export async function isMomentCollected(id: string) {
  return request<{ isCollected: boolean }>(`/content/moments/${id}/is-collected`);
}

export async function repostMoment(id: string) {
  return request<{ success: boolean; reposts: number }>(`/content/moments/${id}/repost`, {
    method: 'POST',
  });
}

export async function getMomentRepostCount(id: string) {
  return request<{ reposts: number }>(`/content/moments/${id}/repost-count`);
}

export async function getUserMomentCollections(userId: string, skip?: number, take?: number) {
  const params = new URLSearchParams();
  if (skip !== undefined) params.append('skip', skip.toString());
  if (take !== undefined) params.append('take', take.toString());
  return request<PostDTO[]>(`/content/moments/user/${userId}/collections?${params}`);
}

export async function getUserMomentLikes(userId: string, skip?: number, take?: number) {
  const params = new URLSearchParams();
  if (skip !== undefined) params.append('skip', skip.toString());
  if (take !== undefined) params.append('take', take.toString());
  return request<PostDTO[]>(`/content/moments/user/${userId}/likes?${params}`);
}

// ==================== 文章(Article) API ====================
// 特性：可关联圈子、可关联话题、出现在首页/搜索/个人主页、支持可见度

export async function createArticle(data: {
  title: string;
  content: string;
  coverCid?: string;
  mediaCid?: string;
  tags?: string;
  visibility?: Visibility;
  circleId?: number;
}) {
  return request<PostDTO>('/content/articles', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getArticles(skip?: number, take?: number) {
  const params = new URLSearchParams();
  if (skip !== undefined) params.append('skip', skip.toString());
  if (take !== undefined) params.append('take', take.toString());
  return request<PostDTO[]>(`/content/articles?${params}`);
}

export async function getArticleFeed(skip?: number, take?: number) {
  const params = new URLSearchParams();
  if (skip !== undefined) params.append('skip', skip.toString());
  if (take !== undefined) params.append('take', take.toString());
  return request<PostDTO[]>(`/content/articles/feed?${params}`);
}

export async function getArticle(id: string) {
  return request<PostDTO>(`/content/articles/${id}`);
}

export async function getUserArticles(userId: string, skip?: number, take?: number) {
  const params = new URLSearchParams();
  if (skip !== undefined) params.append('skip', skip.toString());
  if (take !== undefined) params.append('take', take.toString());
  return request<PostDTO[]>(`/content/articles/user/${userId}?${params}`);
}

export async function updateArticle(id: string, data: Partial<PostDTO>) {
  return request<PostDTO>(`/content/articles/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteArticle(id: string) {
  return request(`/content/articles/${id}`, {
    method: 'DELETE',
  });
}

export async function likeArticle(id: string) {
  return request<{ success: boolean; likes: number }>(`/content/articles/${id}/like`, {
    method: 'POST',
  });
}

export async function unlikeArticle(id: string) {
  return request<{ success: boolean; likes: number }>(`/content/articles/${id}/like`, {
    method: 'DELETE',
  });
}

export async function commentArticle(id: string, content: string, replyToId?: number) {
  return request(`/content/articles/${id}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content, replyToId }),
  });
}

export async function getArticleComments(id: string, skip?: number, take?: number) {
  const params = new URLSearchParams();
  if (skip !== undefined) params.append('skip', skip.toString());
  if (take !== undefined) params.append('take', take.toString());
  return request(`/content/articles/${id}/comments?${params}`);
}

export async function collectArticle(id: string) {
  return request<{ success: boolean; collections: number }>(`/content/articles/${id}/collect`, {
    method: 'POST',
  });
}

export async function uncollectArticle(id: string) {
  return request<{ success: boolean; collections: number }>(`/content/articles/${id}/collect`, {
    method: 'DELETE',
  });
}

export async function isArticleLiked(id: string) {
  return request<{ isLiked: boolean }>(`/content/articles/${id}/is-liked`);
}

export async function isArticleCollected(id: string) {
  return request<{ isCollected: boolean }>(`/content/articles/${id}/is-collected`);
}

export async function repostArticle(id: string) {
  return request<{ success: boolean; reposts: number }>(`/content/articles/${id}/repost`, {
    method: 'POST',
  });
}

export async function getArticleRepostCount(id: string) {
  return request<{ reposts: number }>(`/content/articles/${id}/repost-count`);
}

export async function getUserArticleCollections(userId: string, skip?: number, take?: number) {
  const params = new URLSearchParams();
  if (skip !== undefined) params.append('skip', skip.toString());
  if (take !== undefined) params.append('take', take.toString());
  return request<PostDTO[]>(`/content/articles/user/${userId}/collections?${params}`);
}

export async function getUserArticleLikes(userId: string, skip?: number, take?: number) {
  const params = new URLSearchParams();
  if (skip !== undefined) params.append('skip', skip.toString());
  if (take !== undefined) params.append('take', take.toString());
  return request<PostDTO[]>(`/content/articles/user/${userId}/likes?${params}`);
}

// ==================== 兼容旧接口（帖子 = 文章 + 动态） ====================

export async function createPost(data: { title?: string; content: string; visibility?: string; mediaUrl?: string; mediaCid?: string; circleId?: string }) {
  if (data.title || data.circleId) {
    return createArticle({
      title: data.title || '',
      content: data.content,
      visibility: (data.visibility as Visibility) || 'public',
      mediaCid: data.mediaCid,
      circleId: data.circleId ? parseInt(data.circleId) : undefined,
    });
  }
  return createMoment({
    content: data.content,
    visibility: (data.visibility as Visibility) || 'public',
    mediaCid: data.mediaCid,
    mediaUrl: data.mediaUrl,
  });
}

export async function getPost(id: string) {
  try {
    return await getArticle(id);
  } catch {
    return await getMoment(id);
  }
}

export async function getPostFeed(skip?: number, take?: number) {
  return getArticleFeed(skip, take);
}

export async function getUserPosts(userId: string, skip?: number, take?: number) {
  return getUserArticles(userId, skip, take);
}

// ==================== 用户API ====================

export async function getUser(id: string) {
  return request<UserDTO>(`/users/${id}`);
}

export async function getUserByUsername(username: string) {
  return request<UserDTO>(`/users/username/${username}`);
}

export async function searchUsers(keyword: string, skip?: number, take?: number) {
  const params = new URLSearchParams({ keyword });
  if (skip !== undefined) params.append('skip', skip.toString());
  if (take !== undefined) params.append('take', take.toString());
  return request<UserDTO[]>(`/users?${params}`);
}

export async function followUser(userId: string) {
  return request(`/users/${userId}/follow`, {
    method: 'POST',
  });
}

export async function unfollowUser(userId: string) {
  return request(`/users/${userId}/follow`, {
    method: 'DELETE',
  });
}

export async function getFollowing(userId: string, skip?: number, take?: number) {
  const params = new URLSearchParams();
  if (skip !== undefined) params.append('skip', skip.toString());
  if (take !== undefined) params.append('take', take.toString());
  return request<UserDTO[]>(`/users/${userId}/following?${params}`);
}

export async function getFollowers(userId: string, skip?: number, take?: number) {
  const params = new URLSearchParams();
  if (skip !== undefined) params.append('skip', skip.toString());
  if (take !== undefined) params.append('take', take.toString());
  return request<UserDTO[]>(`/users/${userId}/followers?${params}`);
}

export async function getFollowerCount(userId: string) {
  return request<{ followers: number; following: number }>(`/users/${userId}/follower-count`);
}

export async function blockUser(userId: string) {
  return request(`/users/${userId}/block`, {
    method: 'POST',
  });
}

export async function unblockUser(userId: string) {
  return request(`/users/${userId}/block`, {
    method: 'DELETE',
  });
}

export async function getBlockedUsers(skip?: number, take?: number) {
  const params = new URLSearchParams();
  if (skip !== undefined) params.append('skip', skip.toString());
  if (take !== undefined) params.append('take', take.toString());
  return request<UserDTO[]>(`/users/blocked/list?${params}`);
}

// ==================== 圈子API ====================

export async function createCircle(data: {
  name: string;
  description?: string;
  avatarCid?: string;
  category: string;
}) {
  return request<CircleDTO>('/circles', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getCircles(skip?: number, take?: number) {
  const params = new URLSearchParams();
  if (skip !== undefined) params.append('skip', skip.toString());
  if (take !== undefined) params.append('take', take.toString());
  return request<CircleDTO[]>(`/circles?${params}`);
}

export async function getCircle(id: string) {
  return request<CircleDTO>(`/circles/${id}`);
}

export async function joinCircle(id: string) {
  try {
    return await request(`/circles/${id}/join`, {
      method: 'POST',
    });
  } catch (error: any) {
    if (error.message?.includes('已加入') || error.message?.includes('already')) {
      return { success: true, alreadyJoined: true };
    }
    throw error;
  }
}

export async function leaveCircle(id: string) {
  try {
    return await request(`/circles/${id}/leave`, {
      method: 'POST',
    });
  } catch (error: any) {
    if (error.message?.includes('未加入') || error.message?.includes('不是成员') || error.message?.includes('not a member')) {
      return { success: true, alreadyLeft: true };
    }
    throw error;
  }
}

export async function searchCircles(keyword: string, skip?: number, take?: number) {
  const params = new URLSearchParams({ keyword });
  if (skip !== undefined) params.append('skip', skip.toString());
  if (take !== undefined) params.append('take', take.toString());
  return request<CircleDTO[]>(`/circles/search?${params}`);
}

// ==================== 消息API ====================

export async function sendMessage(userId: string, content: string) {
  return request<MessageDTO>(`/messages/${userId}`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export async function getConversation(userId: string, skip?: number, take?: number) {
  const params = new URLSearchParams();
  if (skip !== undefined) params.append('skip', skip.toString());
  if (take !== undefined) params.append('take', take.toString());
  return request<MessageDTO[]>(`/messages/conversation/${userId}?${params}`);
}

export async function getConversationList() {
  return request(`/messages/list`);
}

export async function getUnreadCount() {
  return request<{ unreadCount: number }>(`/messages/unread/count`);
}

// ==================== 管理员API ====================

export async function getAllUsers(skip?: number, take?: number) {
  const params = new URLSearchParams();
  if (skip !== undefined) params.append('skip', skip.toString());
  if (take !== undefined) params.append('take', take.toString());
  return request<UserDTO[]>(`/admin/users?${params}`);
}

export async function freezeUser(userId: string) {
  return request(`/admin/users/${userId}/freeze`, {
    method: 'POST',
  });
}

export async function unfreezeUser(userId: string) {
  return request(`/admin/users/${userId}/unfreeze`, {
    method: 'POST',
  });
}

export async function getAllPosts(skip?: number, take?: number) {
  const params = new URLSearchParams();
  if (skip !== undefined) params.append('skip', skip.toString());
  if (take !== undefined) params.append('take', take.toString());
  return request<PostDTO[]>(`/admin/posts?${params}`);
}

export async function adminDeletePost(id: string) {
  return request(`/admin/posts/${id}`, {
    method: 'DELETE',
  });
}

export async function getStatistics() {
  return request(`/admin/statistics`);
}

export async function getReports(status?: string, skip?: number, take?: number) {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (skip !== undefined) params.append('skip', skip.toString());
  if (take !== undefined) params.append('take', take.toString());
  return request(`/admin/reports?${params}`);
}
