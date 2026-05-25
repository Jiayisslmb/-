//圈子设置页面

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import BackButton from '@/components/common/BackButton';
import { getIPFSUrl } from '@/lib/ipfs';


interface Member {
  id: number;
  userId: number;
  user: {
    id: number;
    username: string;
    avatarCid?: string;
    bio?: string;
  };
  createdAt: string;
}

interface CirclePost {
  id: number;
  title?: string;
  content: string;
  mediaCid?: string;
  createdAt: string;
  author: {
    id: number;
    username: string;
    avatarCid?: string;
  };
  likes: number;
  comments: number;
}

export default function CircleSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const circleId = params.id as string;
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();

  const [circle, setCircle] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [posts, setPosts] = useState<CirclePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedPost, setSelectedPost] = useState<CirclePost | null>(null);
  const [activeTab, setActiveTab] = useState<'settings' | 'members' | 'posts'>('settings');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    avatarCid: null as string | null,
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [originalAvatarCid, setOriginalAvatarCid] = useState<string | null>(null);

  // 获取圈子信息
  useEffect(() => {
    const fetchCircleInfo = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        const response = await fetch(`/api/circles/${circleId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          throw new Error('获取圈子信息失败'); 
        }
        
        const data = await response.json();
        setCircle(data);
        setFormData({
          name: data.name || '',
          description: data.description || '',
          category: data.category || '',
          avatarCid: data.avatarCid || null,
        });
        setOriginalAvatarCid(data.avatarCid || null);
        if (data.avatarCid) {
          setAvatarPreview(getIPFSUrl(data.avatarCid));
        }
        
        // 获取成员列表
        const membersResponse = await fetch(`/api/circles/${circleId}/members`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (membersResponse.ok) {
          const membersData = await membersResponse.json();
          setMembers(membersData);
        }
        
        // 获取圈子文章
        const postsResponse = await fetch(`/api/circles/${circleId}/posts`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (postsResponse.ok) {
          const postsData = await postsResponse.json();
          const mappedPosts = postsData.map((post: any) => ({
            id: post.id,
            title: post.title,
            content: post.content,
            mediaCid: post.mediaCid,
            createdAt: post.createdAt,
            author: {
              id: post.user.id,
              username: post.user.username,
              nickname: post.user.nickname,
              avatarCid: post.user.avatarCid,
            },
            likes: post.likes,
            comments: post.comments,
          }));
          setPosts(mappedPosts);
        }
      } catch (err) {
        setError('获取圈子信息失败');
        console.error('获取圈子信息失败:', err);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && isAuthenticated) {
      fetchCircleInfo();
    }
  }, [circleId, isAuthenticated, authLoading]);

  // 检查是否是创建者
  const isCreator = user?.id && circle && String(circle.creatorId) === user.id;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCreator) return;
    
    setSaving(true);
    try {
      let updatedAvatarCid = formData.avatarCid;
      if (avatarFile) {
        setAvatarUploading(true);
        try {
          const { uploadToIPFS } = await import('@/lib/ipfs');
          const result = await uploadToIPFS(avatarFile);
          updatedAvatarCid = result.cid;
          setFormData(prev => ({ ...prev, avatarCid: result.cid }));
        } catch (error) {
          console.error('图标上传失败:', error);
          setAvatarUploading(false);
          alert('图标上传失败，请重试');
          setSaving(false);
          return;
        }
        setAvatarUploading(false);
      }

      const token = localStorage.getItem('token');
      const submitData: Record<string, any> = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
      };
      if (avatarFile) {
        submitData.avatarCid = updatedAvatarCid;
      } else if (originalAvatarCid) {
        submitData.avatarCid = originalAvatarCid;
      }
      console.log('提交圈子设置数据:', JSON.stringify(submitData));
      const response = await fetch(`/api/circles/${circleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      });
      
      if (!response.ok) {
        throw new Error('更新失败');
      }
      
      const data = await response.json();
      setCircle(data);
      if (data.avatarCid) {
        setAvatarPreview(getIPFSUrl(data.avatarCid));
        setOriginalAvatarCid(data.avatarCid);
        setFormData(prev => ({ ...prev, avatarCid: data.avatarCid }));
      } else {
        setAvatarPreview(null);
        setOriginalAvatarCid(null);
        setFormData(prev => ({ ...prev, avatarCid: null }));
      }
      setAvatarFile(null);
      alert('圈子设置已保存');
    } catch (err) {
      console.error('更新失败:', err);
      alert('更新失败，请重试');
    } finally {
      setSaving(false);
      setAvatarUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!isCreator) return;
    
    if (confirm('确定要删除这个圈子吗？此操作不可撤销。')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/circles/${circleId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          throw new Error('删除失败');
        }
        
        router.push('/circles');
      } catch (err) {
        console.error('删除失败:', err);
        alert('删除失败，请重试');
      }
    }
  };

  // 踢出成员
  const handleKickMember = async (member: Member) => {
    if (!confirm(`确定要将 ${member.user.username} 踢出圈子吗？`)) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/circles/${circleId}/leave`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: member.userId }),
      });
      
      if (!response.ok) {
        throw new Error('踢出失败');
      }
      
      // 刷新成员列表
      setMembers(members.filter(m => m.userId !== member.userId));
      setSelectedMember(null);
      setShowMemberModal(false);
    } catch (err) {
      console.error('踢出失败:', err);
      alert('踢出失败，请重试');
    }
  };

  // 删除文章
  const handleDeletePost = async (post: CirclePost) => {
    if (!confirm(`确定要删除这篇文章吗？\n\n作者: ${post.author.username}\n内容: ${post.content.substring(0, 50)}...`)) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/content/posts/${post.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('删除失败');
      }
      
      // 刷新文章列表
      setPosts(posts.filter(p => p.id !== post.id));
      setSelectedPost(null);
      setShowPostModal(false);
    } catch (err) {
      console.error('删除文章失败:', err);
      alert('删除文章失败，请重试');
    }
  };

  // 加载中
  if (authLoading || loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">加载中...</p>
      </div>
    );
  }

  // 未登录
  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">请先登录</p>
        <Link href="/auth/sign-in">
          <Button variant="primary">前往登录</Button>
        </Link>
      </div>
    );
  }

  // 错误
  if (error || !circle) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || '圈子不存在'}</p>
        <Button variant="primary" onClick={() => router.push('/circles')}>返回圈子列表</Button>
      </div>
    );
  }

  // 非创建者
  if (!isCreator) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <BackButton />
        </div>
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">您没有权限管理此圈子</p>
            <p className="text-gray-500 text-sm">只有圈子创建者才能访问设置页面</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <BackButton />
      </div>

      <h1 className="text-3xl font-bold mb-6">圈子设置</h1>

      {/* 标签页 */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 border-b-2 ${activeTab === 'settings' ? 'border-blue-600 text-blue-600 font-medium' : 'border-transparent hover:text-blue-600'}`}
        >
          基本设置
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2 border-b-2 ${activeTab === 'members' ? 'border-blue-600 text-blue-600 font-medium' : 'border-transparent hover:text-blue-600'}`}
        >
          成员管理
        </button>
        <button
          onClick={() => setActiveTab('posts')}
          className={`px-4 py-2 border-b-2 ${activeTab === 'posts' ? 'border-blue-600 text-blue-600 font-medium' : 'border-transparent hover:text-blue-600'}`}
        >
          文章管理
        </button>
      </div>

      {/* 基本设置 */}
      {activeTab === 'settings' && (
        <Card className="mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">圈子图标</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden relative">
                  {avatarPreview ? (
                    <>
                      <img src={avatarPreview} alt="圈子图标" className="w-full h-full object-cover" />
                      {avatarUploading && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <span className="text-white text-xs font-medium">正在审核</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-3xl text-gray-400">📍</span>
                  )}
                </div>
                <div>
                  <label className="cursor-pointer">
                    <span className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition">
                      更换图标
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-1">支持 JPG, PNG, GIF 格式</p>
                </div>
              </div>
            </div>

            <Input
              label="圈子名称"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <div className="w-full">
              <label className="block text-sm font-medium mb-2">圈子描述</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">分类</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="技术">技术</option>
                <option value="金融">金融</option>
                <option value="艺术">艺术</option>
                <option value="教育">教育</option>
                <option value="社区">社区</option>
                <option value="其他">其他</option>
              </select>
            </div>

            <div className="flex gap-4 pt-6 border-t">
              <Button variant="primary" type="submit" disabled={saving}>
                {saving ? '保存中...' : '保存设置'}
              </Button>
              <Button variant="danger" type="button" onClick={handleDelete}>
                删除圈子
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* 成员管理 */}
      {activeTab === 'members' && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">成员管理</h3>
            <span className="text-gray-600 text-sm">共 {members.length} 人</span>
          </div>
          
          <div className="space-y-3">
            {members.map(member => (
              <div 
                key={member.id} 
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    {member.user.username?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-medium">{member.user.username}</p>
                    <p className="text-gray-500 text-sm">
                      {member.userId === circle.creatorId ? '创建者' : '成员'}
                    </p>
                  </div>
                </div>
                
                {member.userId !== circle.creatorId && (
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => {
                      setSelectedMember(member);
                      setShowMemberModal(true);
                    }}
                  >
                    管理
                  </Button>
                )}
              </div>
            ))}
            
            {members.length === 0 && (
              <p className="text-gray-500 text-center py-4">暂无成员</p>
            )}
          </div>
        </Card>
      )}

      {/* 文章管理 */}
      {activeTab === 'posts' && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">文章管理</h3>
            <span className="text-gray-600 text-sm">共 {posts.length} 篇</span>
          </div>
          
          <div className="space-y-3">
            {posts.map(post => (
              <div 
                key={post.id} 
                className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{post.author.username}</span>
                    <span className="text-gray-400 text-xs">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {post.title && (
                    <p className="font-medium text-gray-900 mb-1">{post.title}</p>
                  )}
                  <p className="text-gray-600 text-sm line-clamp-2">{post.content}</p>
                </div>
                
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => {
                    setSelectedPost(post);
                    setShowPostModal(true);
                  }}
                >
                  管理
                </Button>
              </div>
            ))}
            
            {posts.length === 0 && (
              <p className="text-gray-500 text-center py-4">暂无文章</p>
            )}
          </div>
        </Card>
      )}

      {/* 成员管理弹窗 */}
      <Modal
        isOpen={showMemberModal}
        onClose={() => {
          setShowMemberModal(false);
          setSelectedMember(null);
        }}
        title={`管理成员: ${selectedMember?.user.username}`}
      >
        {selectedMember && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {selectedMember.user.username?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium">{selectedMember.user.username}</p>
                <p className="text-gray-500 text-sm">{selectedMember.user.bio || '暂无简介'}</p>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <p className="text-gray-600 mb-2">加入时间</p>
              <p className="text-sm">{new Date(selectedMember.createdAt).toLocaleString()}</p>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button 
                variant="danger" 
                className="flex-1"
                onClick={() => handleKickMember(selectedMember)}
              >
                踢出圈子
              </Button>
              <Button 
                variant="secondary" 
                className="flex-1"
                onClick={() => {
                  setShowMemberModal(false);
                  setSelectedMember(null);
                }}
              >
                取消
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 文章管理弹窗 */}
      <Modal
        isOpen={showPostModal}
        onClose={() => {
          setShowPostModal(false);
          setSelectedPost(null);
        }}
        title="管理文章"
      >
        {selectedPost && (
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium">{selectedPost.author.username}</span>
                <span className="text-gray-400 text-xs">
                  {new Date(selectedPost.createdAt).toLocaleString()}
                </span>
              </div>
              {selectedPost.title && (
                <p className="font-medium text-gray-900 mb-2">{selectedPost.title}</p>
              )}
              <p className="text-gray-700">{selectedPost.content}</p>
            </div>
            
            <div className="pt-4 border-t">
              <p className="text-gray-600 mb-2">文章统计</p>
              <div className="flex gap-4 text-sm text-gray-500">
                <span>👍 {selectedPost.likes || 0} 点赞</span>
                <span>💬 {selectedPost.comments || 0} 评论</span>
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button 
                variant="danger" 
                className="flex-1"
                onClick={() => handleDeletePost(selectedPost)}
              >
                删除文章
              </Button>
              <Button 
                variant="secondary" 
                className="flex-1"
                onClick={() => {
                  setShowPostModal(false);
                  setSelectedPost(null);
                }}
              >
                取消
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
