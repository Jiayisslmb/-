'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Link from 'next/link';
import LinkWithBack from '@/components/common/LinkWithBack';
import BackButton from '@/components/common/BackButton';
import { formatDate, formatNumber } from '@/lib/utils';
import { getIPFSUrl } from '@/lib/ipfs';

type Visibility = 'public' | 'followers';

interface Post {
  id: string;
  author: {
    id: string;
    username: string;
    nickname?: string;
    avatarCid?: string;
  };
  content: string;
  mediaCid?: string;
  likes: number;
  comments: number;
  shares: number;
  visibility: Visibility;
  createdAt: string;
  type: 'moment';
  tags?: string[];
}

interface Reply {
  id: number;
  content: string;
  createdAt: string;
  author: {
    id: number;
    username: string;
    nickname?: string;
    avatarCid?: string;
  };
  replyTo?: {
    id: number;
    author: {
      id: number;
      username: string;
      nickname?: string;
    };
  };
}

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  author: {
    id: number;
    username: string;
    nickname?: string;
    avatarCid?: string;
  };
  replies?: Reply[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function MomentDetailPage() {
  const params = useParams();
  const { isAuthenticated, user } = useAuth();
  const postId = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isCollected, setIsCollected] = useState(false);
  const [isRepostMoment, setIsRepostMoment] = useState(false);
  const [likes, setLikes] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Comment | Reply | null>(null);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    const fetchPostDetails = async () => {
      try {
        setLoading(true);

        let postData: any = null;

        try {
          const momentRes = await fetch(`${API_URL}/content/moments/${postId}`);
          if (momentRes.ok) {
            postData = await momentRes.json();
          } else {
            throw new Error('动态不存在');
          }
        } catch (err) {
          throw err;
        }

        if (!postData) throw new Error('内容不存在');

        setPost({
          id: String(postData.id),
          author: {
            id: String(postData.user?.id || postData.author?.id),
            username: postData.user?.username || postData.author?.username,
            nickname: postData.user?.nickname || postData.author?.nickname,
            avatarCid: postData.user?.avatarCid || postData.author?.avatarCid,
          },
          content: postData.content,
          mediaCid: postData.mediaCid,
          likes: postData._count?.momentlike || postData.likes || 0,
          comments: postData._count?.momentcomment || postData.comments || 0,
          shares: postData._count?.momentrepost || postData.shares || 0,
          visibility: (postData.visibility || 'public') as Visibility,
          createdAt: postData.createdAt,
          type: 'moment',
          tags: postData.tags ? (typeof postData.tags === 'string' ? postData.tags.split(',').filter(Boolean) : postData.tags) : [],
        });

        const isRepost = postData.content?.includes('转发内容') || postData.content?.includes('原文链接');
        setIsRepostMoment(isRepost);

        setLikes(postData._count?.momentlike || postData.likes || 0);

        const commentsRes = await fetch(`${API_URL}/content/moments/${postId}/comments`);
        if (commentsRes.ok) {
          const commentsData = await commentsRes.json();
          const commentKey = 'other_momentcomment';
          const replyKey = 'momentcomment';
          const mappedComments = commentsData.map((comment: any) => ({
            id: comment.id,
            content: comment.content,
            createdAt: comment.createdAt,
            author: {
              id: comment.user.id,
              username: comment.user.username,
              nickname: comment.user.nickname,
              avatarCid: comment.user.avatarCid,
            },
            replies: comment[commentKey]?.map((reply: any) => ({
              id: reply.id,
              content: reply.content,
              createdAt: reply.createdAt,
              author: {
                id: reply.user.id,
                username: reply.user.username,
                nickname: reply.user.nickname,
                avatarCid: reply.user.avatarCid,
              },
              replyTo: reply[replyKey] ? {
                id: reply[replyKey].id,
                author: {
                  id: reply[replyKey].user.id,
                  username: reply[replyKey].user.username,
                  nickname: reply[replyKey].user.nickname,
                },
              } : undefined,
            })) || [],
          }));
          setComments(mappedComments);
        }

        if (isAuthenticated && user) {
          const likeResponse = await fetch(`${API_URL}/content/moments/${postId}/is-liked`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          });
          if (likeResponse.ok) {
            const likeData = await likeResponse.json();
            setIsLiked(likeData.isLiked);
          }

          const collectResponse = await fetch(`${API_URL}/content/moments/${postId}/is-collected`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          });
          if (collectResponse.ok) {
            const collectData = await collectResponse.json();
            setIsCollected(collectData.isCollected);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setLoading(false);
      }
    };

    if (postId) fetchPostDetails();
  }, [postId, isAuthenticated, user]);

  const handleLike = async () => {
    if (!isAuthenticated) { alert('请先登录'); return; }
    try {
      const method = isLiked ? 'DELETE' : 'POST';
      const response = await fetch(`${API_URL}/content/moments/${postId}/like`, {
        method, headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (response.ok) {
        setLikes(prev => isLiked ? prev - 1 : prev + 1);
        setIsLiked(!isLiked);
      }
    } catch (err) { console.error('点赞操作失败:', err); }
  };

  const handleCollect = async () => {
    if (!isAuthenticated) { alert('请先登录'); return; }
    try {
      const method = isCollected ? 'DELETE' : 'POST';
      const response = await fetch(`${API_URL}/content/moments/${postId}/collect`, {
        method, headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (response.ok) setIsCollected(!isCollected);
    } catch (err) { console.error('收藏操作失败:', err); }
  };

  const handleShare = async () => {
    if (!isAuthenticated) { alert('请先登录'); return; }
    try {
      // 使用 count_only 模式，只更新计数器，不创建新动态
      const response = await fetch(`${API_URL}/content/moments/${postId}/repost?action=count_only`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (post) setPost({ ...post, shares: data.reposts });
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.message || '转发失败');
      }
    } catch (err) { console.error('转发操作失败:', err); alert('转发失败，请重试'); }
  };

  const handleCommentSubmit = async () => {
    if (!isAuthenticated) { alert('请先登录'); return; }
    if (!newComment.trim()) return;
    try {
      setSubmittingComment(true);
      const response = await fetch(`${API_URL}/content/moments/${postId}/comments`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      });
      if (response.ok) {
        const newCommentData = await response.json();
        const mappedComment = {
          id: newCommentData.id, content: newCommentData.content, createdAt: newCommentData.createdAt,
          author: { id: newCommentData.user.id, username: newCommentData.user.username, nickname: newCommentData.user.nickname, avatarCid: newCommentData.user.avatarCid },
          replies: [],
        };
        setComments([mappedComment, ...comments]);
        setNewComment('');
        if (post) setPost({ ...post, comments: (post.comments || 0) + 1 });
      }
    } catch (err) { console.error('评论操作失败:', err); }
    finally { setSubmittingComment(false); }
  };

  const handleReplySubmit = async (parentId: number, parentType: 'comment' | 'reply' = 'comment') => {
    if (!isAuthenticated) { alert('请先登录'); return; }
    if (!replyContent.trim()) return;
    try {
      const response = await fetch(`${API_URL}/content/moments/${postId}/comments`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent, replyToId: parentId }),
      });
      if (response.ok) {
        const newReply = await response.json();
        const commentKey = 'momentcomment';
        const mappedReply = {
          id: newReply.id, content: newReply.content, createdAt: newReply.createdAt,
          author: { id: newReply.user.id, username: newReply.user.username, nickname: newReply.user.nickname, avatarCid: newReply.user.avatarCid },
          replyTo: newReply[commentKey] ? { id: newReply[commentKey].id, author: { id: newReply[commentKey].user.id, username: newReply[commentKey].user.username, nickname: newReply[commentKey].user.nickname } } : undefined,
        };
        if (parentType === 'comment') {
          setComments(comments.map(c => c.id === parentId ? { ...c, replies: [...(c.replies || []), mappedReply] } : c));
        } else {
          setComments(comments.map(c => c.replies?.some(r => r.id === parentId) ? { ...c, replies: [...(c.replies || []), mappedReply] } : c));
        }
        setReplyContent('');
        setReplyingTo(null);
        if (post) setPost({ ...post, comments: (post.comments || 0) + 1 });
      }
    } catch (err) { console.error('回复操作失败:', err); }
  };

  const getVisibilityLabel = (visibility: Visibility) => {
    switch (visibility) {
      case 'public': return '🌐 公开可见';
      case 'followers': return '👥 仅关注者';
      default: return '🌐 公开可见';
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <div className="inline-flex items-center gap-3 px-6 py-4 bg-[#F0EFFF]/50 rounded-2xl">
          <svg className="animate-spin h-5 w-5 text-[#6364FF]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-gray-600 font-medium">加载中...</span>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <Card className="border-gray-200 shadow-sm p-10">
          <p className="text-gray-500 mb-2 text-lg">😔</p>
          <p className="text-gray-600 mb-6">{error || '内容不存在'}</p>
          <Link href="/">
            <Button variant="primary">返回首页</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="mb-2"><BackButton /></div>

      <Card className="border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 space-y-5">
          <div className="flex gap-4">
            <Avatar src={getIPFSUrl(post.author.avatarCid)} name={post.author.nickname || post.author.username} size="md" />
            <div className="flex-1 min-w-0">
              <LinkWithBack href={`/profile/${post.author.username}`} className="hover:text-[#6364FF] transition-colors duration-200">
                <span className="font-semibold text-gray-900 tracking-tight">{post.author.nickname && post.author.nickname !== post.author.username ? post.author.nickname : ''}</span>
              </LinkWithBack>
              <div className="flex items-center flex-wrap gap-1 mt-0.5">
                <LinkWithBack href={`/profile/${post.author.username}`} className="text-gray-500 text-sm hover:text-[#6364FF] transition-colors">@{post.author.username}</LinkWithBack>
                <span className="text-gray-400 text-sm">·</span>
                <span className="text-gray-500 text-sm">{formatDate(post.createdAt)}</span>
                <span className="text-gray-400 text-sm">·</span>
                <span className="text-gray-500 text-sm">{getVisibilityLabel(post.visibility)}</span>
                <span className="text-green-500 text-xs font-medium bg-green-50 px-2 py-0.5 rounded-full ml-1">💬 动态</span>
              </div>
            </div>
          </div>

          <div className="text-gray-700 whitespace-pre-wrap leading-relaxed text-base">{post.content}</div>

          {post.mediaCid && (
            <div className="rounded-xl overflow-hidden group relative">
              <img src={getIPFSUrl(post.mediaCid)} alt="media" className="w-full max-h-96 object-cover" />
            </div>
          )}

          {post.tags && Array.isArray(post.tags) && post.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap pt-1">
              {post.tags.map((tag, index) => (
                <Link key={index} href={`/topic/${encodeURIComponent(String(tag))}`}
                  className="text-[#6364FF] hover:bg-[#F0EFFF] px-2.5 py-1 rounded-full text-sm font-medium transition-all duration-200"
                >#{tag}</Link>
              ))}
            </div>
          )}

          <div className="flex gap-1 pt-4 border-t border-gray-100">
            <button onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm ${isLiked ? 'text-red-500 bg-red-50' : 'hover:text-red-500 hover:bg-red-50 text-gray-500'}`}>
              <svg className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{formatNumber(likes)}</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl hover:text-[#6364FF] hover:bg-[#F0EFFF] transition-all duration-200 font-medium text-sm text-gray-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              <span>{formatNumber(post.comments)}</span>
            </button>
            {!isRepostMoment && (
            <button onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl hover:text-green-600 hover:bg-green-50 transition-all duration-200 font-medium text-sm text-gray-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
              <span>{formatNumber(post.shares)}</span>
            </button>
            )}
            <button onClick={handleCollect}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm ${isCollected ? 'text-yellow-500 bg-yellow-50' : 'hover:text-yellow-600 hover:bg-yellow-50 text-gray-500'}`}>
              <svg className={`w-5 h-5 ${isCollected ? 'fill-current' : ''}`} fill={isCollected ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
            </button>
          </div>
        </div>
      </Card>

      <Card className="border-gray-200 shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">评论 ({formatNumber(post.comments)})</h2>
          </div>

          {isAuthenticated && (
            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)}
                placeholder="写下你的评论..." rows={3}
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

          {comments.length > 0 ? (
            <div className="space-y-4 divide-y divide-gray-100">
              {comments.map(comment => (
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
                      >回复</button>

                      {replyingTo?.id === comment.id && (
                        <div className="mt-3 pl-3 border-l-2 border-[#6364FF]/20">
                          <textarea value={replyContent} onChange={(e) => setReplyContent(e.target.value)}
                            placeholder={`回复 ${comment.author.nickname || comment.author.username}...`} rows={2}
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#6364FF] focus:ring-2 focus:ring-[#6364FF]/20 resize-none text-sm transition-all duration-200"
                          />
                          <div className="flex justify-end gap-2 mt-2">
                            <button onClick={() => { setReplyingTo(null); setReplyContent(''); }}
                              className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">取消</button>
                            <Button variant="primary" size="sm" onClick={() => handleReplySubmit(comment.id, 'comment')}
                              disabled={!replyContent.trim()}>发送</Button>
                          </div>
                        </div>
                      )}

                      {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-3 space-y-3 pl-2">
                          {comment.replies.map(reply => (
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
                                >回复</button>

                                {replyingTo?.id === reply.id && (
                                  <div className="mt-2 pl-2 border-l-2 border-[#6364FF]/20">
                                    <textarea value={replyContent} onChange={(e) => setReplyContent(e.target.value)}
                                      placeholder={`回复 ${reply.author.nickname || reply.author.username}...`} rows={2}
                                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#6364FF] focus:ring-2 focus:ring-[#6364FF]/20 resize-none text-xs transition-all duration-200"
                                    />
                                    <div className="flex justify-end gap-2 mt-2">
                                      <button onClick={() => { setReplyingTo(null); setReplyContent(''); }}
                                        className="px-2.5 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">取消</button>
                                      <Button variant="primary" size="sm" onClick={() => handleReplySubmit(reply.id, 'reply')}
                                        disabled={!replyContent.trim()}>发送</Button>
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
    </div>
  );
}