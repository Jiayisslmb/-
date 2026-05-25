'use client';

import Link from 'next/link';
import LinkWithBack from '@/components/common/LinkWithBack';
import Card from './ui/Card';
import Avatar from './ui/Avatar';
import Button from './ui/Button';

interface UserItem {
  id: string;
  username: string;
  avatar?: string;
  bio: string;
  followers: number;
  isFollowing?: boolean;
}

interface UserListProps {
  title: string;
  subtitle: string;
  users: UserItem[];
  onFollow?: (userId: string) => void;
}

export default function UserList({ title, subtitle, users, onFollow }: UserListProps) {
  return (
    <div className="max-w-2xl mx-auto animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">{title}</h1>
        <p className="text-gray-600 leading-relaxed">{subtitle}</p>
        <div className="mt-2 h-1 w-20 bg-gradient-to-r from-[#6364FF] to-[#8B83FF] rounded-full"></div>
      </div>

      <div className="space-y-4">
        {users.map(user => (
          <Card key={user.id} hoverable className="p-5">
            <div className="flex justify-between items-center">
              <LinkWithBack href={`/profile/${user.username}`} className="flex-1 flex gap-4 items-center hover:opacity-75 transition-opacity duration-200">
                <Avatar src={user.avatar} name={user.username} size="lg" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900">{user.username}</h3>
                  <p className="text-gray-600 text-sm line-clamp-2 mt-1 leading-relaxed">{user.bio || '这个人很懒，什么都没有写...'}</p>
                  <p className="text-gray-500 text-xs mt-2 font-medium">{user.followers} 粉丝</p>
                </div>
              </LinkWithBack>
              <Button 
                variant={user.isFollowing ? 'secondary' : 'primary'}
                size="sm"
                onClick={() => onFollow?.(user.id)}
                className={`ml-4 ${user.isFollowing ? '' : 'shadow-sm hover:shadow-md'}`}
              >
                {user.isFollowing ? '✓ 已关注' : '+ 关注'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
