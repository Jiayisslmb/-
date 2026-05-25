import useSWR, { type SWRConfiguration } from 'swr';
import useSWRInfinite from 'swr/infinite';
import { request } from './fetch-client';
import type { UserDTO, PostDTO, CircleDTO, MessageDTO } from '@/types';

const fetcher = async <T>(url: string): Promise<T> => {
  return request<T>(url);
};

const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 5000,
  errorRetryCount: 2,
};

// ==================== User hooks ====================

export function useUser(userId: string | null) {
  return useSWR<UserDTO>(userId ? `/users/${userId}` : null, fetcher, defaultConfig);
}

export function useUserByUsername(username: string | null) {
  return useSWR<UserDTO>(
    username ? `/users/username/${username}` : null,
    fetcher,
    defaultConfig,
  );
}

export function useFollowers(userId: string | null) {
  return useSWR<UserDTO[]>(
    userId ? `/users/${userId}/followers` : null,
    fetcher,
    defaultConfig,
  );
}

export function useFollowing(userId: string | null) {
  return useSWR<UserDTO[]>(
    userId ? `/users/${userId}/following` : null,
    fetcher,
    defaultConfig,
  );
}

// ==================== Content hooks ====================

export function useArticles(skip = 0, take = 20) {
  return useSWR<PostDTO[]>(`/content/articles?skip=${skip}&take=${take}`, fetcher, defaultConfig);
}

export function useArticleFeed() {
  return useSWRInfinite<PostDTO[]>(
    (index, previousPageData) => {
      if (previousPageData && previousPageData.length === 0) return null;
      return `/content/articles/feed?skip=${index * 20}&take=20`;
    },
    fetcher,
    { ...defaultConfig, revalidateFirstPage: false },
  );
}

export function useArticle(id: string | null) {
  return useSWR<PostDTO>(id ? `/content/articles/${id}` : null, fetcher, defaultConfig);
}

export function useMoments(userId: string | null) {
  return useSWR<PostDTO[]>(
    userId ? `/content/moments/user/${userId}` : null,
    fetcher,
    defaultConfig,
  );
}

export function useMoment(id: string | null) {
  return useSWR<PostDTO>(id ? `/content/moments/${id}` : null, fetcher, defaultConfig);
}

// ==================== Circle hooks ====================

export function useCircles(skip = 0, take = 20) {
  return useSWR<CircleDTO[]>(`/circles?skip=${skip}&take=${take}`, fetcher, defaultConfig);
}

export function useCircle(id: string | null) {
  return useSWR<CircleDTO>(id ? `/circles/${id}` : null, fetcher, defaultConfig);
}

// ==================== Message hooks ====================

export function useConversations() {
  return useSWR<MessageDTO[]>('/messages/list', fetcher, defaultConfig);
}

export function useConversation(userId: string | null) {
  return useSWR<MessageDTO[]>(
    userId ? `/messages/conversation/${userId}` : null,
    fetcher,
    defaultConfig,
  );
}

export function useUnreadCount() {
  return useSWR<{ unreadCount: number }>(
    '/messages/unread/count',
    fetcher,
    { ...defaultConfig, refreshInterval: 15000 },
  );
}

// ==================== Hot search ====================

export function useHotSearches() {
  return useSWR<Array<{ id: number; keyword: string; searchCount: number }>>(
    '/topics/hot-search?limit=10',
    fetcher,
    { ...defaultConfig, revalidateOnFocus: false },
  );
}

export { fetcher, defaultConfig };
