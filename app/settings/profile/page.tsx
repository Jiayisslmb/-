//个人资料设置页面

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { getIPFSUrl } from '@/lib/ipfs';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import SettingsLayout from '@/components/layout/SettingsLayout';


export default function ProfileSettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, updateProfile } = useAuth();

  const [formData, setFormData] = useState({
    nickname: '',
    bio: '',
    avatarCid: '',
    backgroundCid: '',
    backgroundColor: '#f0f0f0',
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [backgroundPreview, setBackgroundPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        nickname: user.nickname || '',
        bio: user.bio || '',
        avatarCid: user.avatarCid || '',
        backgroundCid: user.backgroundCid || '',
        backgroundColor: user.backgroundColor || '#f0f0f0',
      });
      if (user.avatarCid) {
        setAvatarPreview(getIPFSUrl(user.avatarCid));
      }
      if (user.backgroundCid) {
        setBackgroundPreview(getIPFSUrl(user.backgroundCid));
      }
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      try {
        const { uploadToIPFS } = await import('@/lib/ipfs');
        const result = await uploadToIPFS(file);
        console.log('头像上传成功:', result);
        setFormData(prev => ({ ...prev, avatarCid: result.cid }));
        setAvatarPreview(result.url);
      } catch (error) {
        console.error('头像上传失败:', error);
        alert('头像上传失败，请重试');
      }
    }
  };

  const handleBackgroundChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBackgroundFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setBackgroundPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      try {
        const { uploadToIPFS } = await import('@/lib/ipfs');
        const result = await uploadToIPFS(file);
        console.log('封面图片上传成功:', result);
        setFormData(prev => ({ ...prev, backgroundCid: result.cid }));
        setBackgroundPreview(result.url);
      } catch (error) {
        console.error('封面图片上传失败:', error);
        alert('封面图片上传失败，请重试');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!user) {
        throw new Error('用户未登录');
      }

      if (avatarFile && !formData.avatarCid.includes('ipfs')) {
        const { uploadToIPFS } = await import('@/lib/ipfs');
        const avatarResult = await uploadToIPFS(avatarFile);
        setFormData(prev => ({ ...prev, avatarCid: avatarResult.cid }));
      }

      if (backgroundFile && !formData.backgroundCid.includes('ipfs')) {
        const { uploadToIPFS } = await import('@/lib/ipfs');
        const bgResult = await uploadToIPFS(backgroundFile);
        setFormData(prev => ({ ...prev, backgroundCid: bgResult.cid }));
      }
      
      const result = await updateProfile({
        nickname: formData.nickname,
        bio: formData.bio,
        avatarCid: formData.avatarCid || undefined,
        backgroundCid: formData.backgroundCid || undefined,
        backgroundColor: formData.backgroundColor,
      });

      setShowSuccessToast(true);
      setTimeout(() => {
        setShowSuccessToast(false);
        window.dispatchEvent(new CustomEvent('profileUpdated', { detail: result }));
        router.push(`/profile/${user.username}`);
      }, 1500);
    } catch (error) {
      console.error('更新失败:', error);
      alert('更新失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <SettingsLayout title="个人资料">
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4 font-medium">请先登录</p>
          <Button variant="primary" onClick={() => router.push('/auth/sign-in')} className="!rounded-xl shadow-md hover:shadow-lg">
            前往登录
          </Button>
        </div>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout title="个人资料">
      {/* 成功提示 Toast */}
      {showSuccessToast && (
        <div className="fixed top-4 right-4 z-50 animate-slideDown">
          <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-3 rounded-xl shadow-lg flex items-center gap-3">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold">个人资料已保存</span>
          </div>
        </div>
      )}

      <Card className="border-gray-200 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="divide-y divide-gray-100">
          {/* 头像上传 */}
          <div className="p-6 space-y-4 hover:bg-gray-50/50 transition-colors duration-200">
            <label className="block text-sm font-bold text-gray-900 mb-1">头像</label>
            <p className="text-xs text-gray-500 mb-4">推荐使用正方形图片，至少 300×300 像素</p>
            
            <div className="flex items-start gap-6">
              <div className="relative group">
                <div className="w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-[#F0EFFF] to-[#EDE9FE] border-4 border-white shadow-lg ring-2 ring-[#6364FF]/20 group-hover:ring-[#6364FF]/40 transition-all duration-300">
                  {avatarPreview ? (
                    <img 
                      src={avatarPreview} 
                      alt="头像预览" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-[#6364FF]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  id="avatar-upload"
                />
                <label htmlFor="avatar-upload" className="absolute inset-0 cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50 rounded-full transition-opacity duration-300">
                  <div className="text-center text-white">
                    <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-xs mt-1 block">更换</span>
                  </div>
                </label>
              </div>

              <div className="flex-1 pt-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => document.getElementById('avatar-upload')?.click()} className="!rounded-lg">
                  选择新头像
                </Button>
                <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                  支持 JPG、PNG、WebP 格式<br/>
                  最大文件大小：2MB<br/>
                  将自动裁剪为圆形
                </p>
              </div>
            </div>
          </div>

          {/* 封面设置 */}
          <div className="p-6 space-y-4 hover:bg-gray-50/50 transition-colors duration-200">
            <label className="block text-sm font-bold text-gray-900 mb-1">封面图</label>
            <p className="text-xs text-gray-500 mb-4">显示在个人主页顶部的背景图片，建议尺寸 1200×400 像素</p>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="relative group w-48 h-28 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-dashed border-gray-300 hover:border-[#6364FF] transition-all duration-300 cursor-pointer">
                  {backgroundPreview ? (
                    <>
                      <img src={backgroundPreview} alt="封面预览" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                        <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <svg className="w-10 h-10 text-gray-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs text-gray-500">点击上传</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-1 pt-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBackgroundChange}
                    className="hidden"
                    id="background-upload"
                  />
                  <label htmlFor="background-upload">
                    <Button type="button" variant="secondary" size="sm" onClick={() => document.getElementById('background-upload')?.click()} className="!rounded-lg">
                      选择封面图
                    </Button>
                  </label>
                  <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                    支持 JPG、PNG、WebP 格式<br/>
                    最大文件大小：5MB<br/>
                    将显示在个人主页顶部
                  </p>
                </div>
              </div>

              {/* 封面颜色 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">背景颜色（无封面图时使用）</label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    name="backgroundColor"
                    value={formData.backgroundColor}
                    onChange={handleChange}
                    className="w-14 h-14 rounded-xl border-2 border-gray-300 cursor-pointer hover:border-[#6364FF] transition-all duration-200 shadow-sm"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      name="backgroundColor"
                      value={formData.backgroundColor}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#6364FF] focus:border-[#6364FF] font-mono text-sm transition-all duration-200"
                      placeholder="#f0f0f0"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 昵称 */}
          <div className="p-6 space-y-3 hover:bg-gray-50/50 transition-colors duration-200">
            <label htmlFor="nickname" className="block text-sm font-bold text-gray-900 mb-1">
              昵称
            </label>
            <Input
              id="nickname"
              name="nickname"
              value={formData.nickname}
              onChange={handleChange}
              placeholder="输入你的昵称"
              helperText="用于展示的名称，最多20个字符，可以随时修改"
            />
          </div>

          {/* 个人简介 */}
          <div className="p-6 space-y-3 hover:bg-gray-50/50 transition-colors duration-200">
            <label htmlFor="bio" className="block text-sm font-bold text-gray-900 mb-1">
              个人简介
            </label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="介绍一下自己..."
              rows={4}
              maxLength={200}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#6364FF] focus:border-[#6364FF] resize-none transition-all duration-200 hover:border-gray-400 text-sm leading-relaxed"
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">
                用简短的语言描述你自己，让其他人更好地了解你
              </p>
              <span className={`text-xs font-medium ${formData.bio.length > 180 ? 'text-red-500' : 'text-gray-400'}`}>
                {formData.bio.length}/200
              </span>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="p-6 bg-gray-50/50 flex gap-4">
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              isLoading={loading}
              className="flex-1 !rounded-xl shadow-md hover:shadow-lg"
            >
              保存更改
            </Button>
            <Button 
              type="button" 
              variant="secondary" 
              className="flex-1 !rounded-xl" 
              onClick={() => router.push('/profile/' + user?.username)}
            >
              取消
            </Button>
          </div>
        </form>
      </Card>
    </SettingsLayout>
  );
}
