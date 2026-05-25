//设置主页面 - 重定向到个人资料设置

import { redirect } from 'next/navigation';

export default function SettingsPage() {
  redirect('/settings/profile');
}

