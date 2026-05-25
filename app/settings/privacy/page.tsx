//隐私与可达性设置页面

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import SettingsLayout from '@/components/layout/SettingsLayout';
import { toast } from '@/lib/toast';


export default function PrivacySettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, updateProfile } = useAuth();

  const [formData, setFormData] = useState({
    allowFollow: true,
    allowMessage: true,
    hideFollowing: false,
    hideFollowers: false,
    hideLikes: false,
    hideCollections: false,
  });

  const [loading, setLoading] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        allowFollow: user.allowFollow !== undefined ? user.allowFollow : true,
        allowMessage: user.allowMessage !== undefined ? user.allowMessage : true,
        hideFollowing: user.hideFollowing !== undefined ? user.hideFollowing : false,
        hideFollowers: user.hideFollowers !== undefined ? user.hideFollowers : false,
        hideLikes: user.hideLikes !== undefined ? user.hideLikes : false,
        hideCollections: user.hideCollections !== undefined ? user.hideCollections : false,
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateProfile({
        allowFollow: formData.allowFollow,
        allowMessage: formData.allowMessage,
        hideFollowing: formData.hideFollowing,
        hideFollowers: formData.hideFollowers,
        hideLikes: formData.hideLikes,
        hideCollections: formData.hideCollections,
      });

      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (error) {
      console.error('更新失败:', error);
      toast.error('更新失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <SettingsLayout title="隐私与可达性">
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
    <SettingsLayout title="隐私与可达性">
      {/* 成功提示 Toast */}
      {showSuccessToast && (
        <div className="fixed top-4 right-4 z-50 animate-slideDown">
          <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-3 rounded-xl shadow-lg flex items-center gap-3">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold">隐私设置已保存</span>
          </div>
        </div>
      )}

      <Card className="border-gray-200 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="divide-y divide-gray-100">
          {/* 新人发现与关注权限 */}
          <div className="p-6 space-y-4 hover:bg-gray-50/50 transition-colors duration-200">
            <h2 className="text-base font-bold text-gray-900">新人发现与关注权限</h2>
            
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="allowFollow"
                  checked={formData.allowFollow}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  允许其他用户关注我
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="allowMessage"
                  checked={formData.allowMessage}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  允许其他用户给我发私信
                </span>
              </label>
            </div>
          </div>

          {/* 个人资料可见性 */}
          <div className="p-6 space-y-4 hover:bg-gray-50/50 transition-colors duration-200">
            <h2 className="text-base font-bold text-gray-900">个人资料可见性</h2>
            
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="hideFollowing"
                  checked={formData.hideFollowing}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  隐藏我的关注列表
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="hideFollowers"
                  checked={formData.hideFollowers}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  隐藏我的粉丝列表
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="hideLikes"
                  checked={formData.hideLikes}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  隐藏我的点赞列表
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="hideCollections"
                  checked={formData.hideCollections}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  隐藏我的收藏列表
                </span>
              </label>
            </div>
          </div>

          {/* 个人信息透露程度 */}
          <div className="p-6 space-y-4 hover:bg-gray-50/50 transition-colors duration-200">
            <h2 className="text-base font-bold text-gray-900">个人信息透露程度</h2>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                您可以通过上述设置控制个人信息的透露程度，保护您的隐私安全。
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
            <Button type="button" variant="secondary" className="flex-1 !rounded-xl" onClick={() => router.push('/profile/' + user?.username)}>
              取消
            </Button>
          </div>
        </form>
      </Card>
    </SettingsLayout>
  );
}
