//偏好设置页面

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { usePreferences } from '@/lib/preferences';
import { getIPFSUrl } from '@/lib/ipfs';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import SettingsLayout from '@/components/layout/SettingsLayout';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function PreferencesPage() {
  const router = useRouter();
  const { user, isAuthenticated, updateProfile } = useAuth();
  const { updatePreferences } = usePreferences();

  const [formData, setFormData] = useState({
    globalBackgroundCid: '',
    globalBackgroundColor: '#ffffff',
    language: 'zh-CN',
    fontSize: 'medium',
    colorScheme: 'light',
    defaultVisibility: 'public',
  });

  const [globalBackgroundFile, setGlobalBackgroundFile] = useState<File | null>(null);
  const [globalBackgroundPreview, setGlobalBackgroundPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        globalBackgroundCid: user.globalBackgroundCid || '',
        globalBackgroundColor: user.globalBackgroundColor || '#ffffff',
        language: user.language || 'zh-CN',
        fontSize: user.fontSize || 'medium',
        colorScheme: user.colorScheme || 'light',
        defaultVisibility: user.defaultVisibility || 'public',
      });
      if (user.globalBackgroundCid) {
        setGlobalBackgroundPreview(getIPFSUrl(user.globalBackgroundCid));
      }
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'language' || name === 'fontSize' || name === 'colorScheme') {
      updatePreferences({ [name]: value });
    }
  };

  const handleGlobalBackgroundChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setGlobalBackgroundFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setGlobalBackgroundPreview(base64);
      };
      reader.readAsDataURL(file);
      
      try {
        const { uploadToIPFS } = await import('@/lib/ipfs');
        const result = await uploadToIPFS(file);
        console.log('背景图片上传成功:', result);
        setFormData(prev => ({ ...prev, globalBackgroundCid: result.cid }));
        setGlobalBackgroundPreview(result.url);
      } catch (error) {
        console.error('背景图片上传失败:', error);
        alert('背景图片上传失败，请重试');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateProfile({
        globalBackgroundCid: formData.globalBackgroundCid || undefined,
        globalBackgroundColor: formData.globalBackgroundColor,
        language: formData.language,
        fontSize: formData.fontSize,
        colorScheme: formData.colorScheme,
        defaultVisibility: formData.defaultVisibility,
      });

      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (error) {
      console.error('更新失败:', error);
      alert('更新失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <SettingsLayout title="偏好设置">
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
    <SettingsLayout title="偏好设置">
      {/* 成功提示 Toast */}
      {showSuccessToast && (
        <div className="fixed top-4 right-4 z-50 animate-slideDown">
          <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-3 rounded-xl shadow-lg flex items-center gap-3">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold">偏好设置已保存</span>
          </div>
        </div>
      )}

      <Card className="border-gray-200 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="divide-y divide-gray-100">
          {/* 系统语言 */}
          <div className="p-6 space-y-3 hover:bg-gray-50/50 transition-colors duration-200">
            <label className="block text-sm font-bold text-gray-900 mb-1">
              系统语言
            </label>
            <p className="text-xs text-gray-500 mb-3">选择你偏好的界面显示语言</p>
            <select
              name="language"
              value={formData.language}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#6364FF] focus:border-[#6364FF] bg-white transition-all duration-200 hover:border-gray-400"
            >
              <option value="zh-CN">简体中文</option>
              <option value="en-US">English</option>
            </select>
          </div>

          {/* 字体设置 */}
          <div className="p-6 space-y-3 hover:bg-gray-50/50 transition-colors duration-200">
            <label className="block text-sm font-bold text-gray-900 mb-1">
              字体大小
            </label>
            <p className="text-xs text-gray-500 mb-3">调整界面文字大小以提升阅读舒适度</p>
            <select
              name="fontSize"
              value={formData.fontSize}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#6364FF] focus:border-[#6364FF] bg-white transition-all duration-200 hover:border-gray-400"
            >
              <option value="small">小 - 适合小屏幕设备</option>
              <option value="medium">中 - 推荐默认选项</option>
              <option value="large">大 - 提升可读性</option>
            </select>
          </div>

          {/* 配色方案 */}
          <div className="p-6 space-y-3 hover:bg-gray-50/50 transition-colors duration-200">
            <label className="block text-sm font-bold text-gray-900 mb-1">
              配色方案
            </label>
            <p className="text-xs text-gray-500 mb-3">选择适合你的视觉主题</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setFormData(prev => ({ ...prev, colorScheme: 'light' }));
                  updatePreferences({ colorScheme: 'light' });
                }}
                className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                  formData.colorScheme === 'light'
                    ? 'border-[#6364FF] bg-[#F0EFFF] shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-white border border-gray-200"></div>
                  <div className="text-left">
                    <div className="font-semibold text-sm text-gray-900">浅色模式</div>
                    <div className="text-xs text-gray-500">明亮清晰</div>
                  </div>
                </div>
                {formData.colorScheme === 'light' && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-[#6364FF] rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setFormData(prev => ({ ...prev, colorScheme: 'dark' }));
                  updatePreferences({ colorScheme: 'dark' });
                }}
                className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                  formData.colorScheme === 'dark'
                    ? 'border-[#6364FF] bg-[#F0EFFF] shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700"></div>
                  <div className="text-left">
                    <div className="font-semibold text-sm text-gray-900">深色模式</div>
                    <div className="text-xs text-gray-500">护眼舒适</div>
                  </div>
                </div>
                {formData.colorScheme === 'dark' && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-[#6364FF] rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* 背景设置 */}
          <div className="p-6 space-y-4 hover:bg-gray-50/50 transition-colors duration-200">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1">
                背景
              </label>
              <p className="text-xs text-gray-500 mb-4">
                设置后，登录状态下所有页面都将显示此背景
              </p>
              
              <div className="space-y-4">
                {/* 背景图片 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">背景图片</label>
                  <div className="flex items-start gap-4">
                    <div className="w-40 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 hover:border-[#6364FF] transition-all duration-200 cursor-pointer group">
                      {globalBackgroundPreview ? (
                        <img src={globalBackgroundPreview} alt="背景预览" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center">
                          <svg className="w-8 h-8 text-gray-400 mx-auto mb-1 group-hover:text-[#6364FF] transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-xs text-gray-500 group-hover:text-[#6364FF] transition-colors duration-200">点击上传</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleGlobalBackgroundChange}
                        className="hidden"
                        id="background-upload"
                      />
                      <label htmlFor="background-upload">
                        <Button type="button" variant="secondary" size="sm" onClick={() => document.getElementById('background-upload')?.click()} className="!rounded-lg">
                          选择背景图
                        </Button>
                      </label>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        支持 JPG、PNG、WebP 格式<br/>
                        建议尺寸：1920×1080 像素<br/>
                        最大文件大小：5MB
                      </p>
                    </div>
                  </div>
                </div>

                {/* 背景颜色 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">背景颜色（无背景图时使用）</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      name="globalBackgroundColor"
                      value={formData.globalBackgroundColor}
                      onChange={handleChange}
                      className="w-14 h-14 rounded-xl border-2 border-gray-300 cursor-pointer hover:border-[#6364FF] transition-all duration-200 shadow-sm"
                    />
                    <div className="flex-1">
                      <input
                        type="text"
                        name="globalBackgroundColor"
                        value={formData.globalBackgroundColor}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#6364FF] focus:border-[#6364FF] font-mono text-sm transition-all duration-200"
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 发布内容默认值 */}
          <div className="p-6 space-y-4 hover:bg-gray-50/50 transition-colors duration-200">
            <h2 className="text-base font-bold text-gray-900">发布内容默认值</h2>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                默认可见性
              </label>
              <select
                name="defaultVisibility"
                value={formData.defaultVisibility}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#6364FF] focus:border-[#6364FF] bg-white transition-all duration-200 hover:border-gray-400"
              >
                <option value="public">🌐 公开 - 所有人可见</option>
                <option value="followers">👥 仅关注者 - 仅粉丝可见</option>
              </select>
              <p className="text-xs text-gray-500 mt-2">
                发布新内容时的默认隐私设置，可在发布时修改
              </p>
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
