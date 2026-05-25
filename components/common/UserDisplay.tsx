import React from 'react';

interface UserDisplayProps {
  nickname?: string | null;
  username: string;
  size?: 'sm' | 'md' | 'lg';
  layout?: 'inline' | 'stack';
  className?: string;
}

export default function UserDisplay({
  nickname,
  username,
  size = 'md',
  layout = 'stack',
  className = ''
}: UserDisplayProps) {
  const sizeClasses = {
    sm: {
      nickname: 'text-sm',
      username: 'text-xs',
    },
    md: {
      nickname: 'text-base',
      username: 'text-sm',
    },
    lg: {
      nickname: 'text-lg',
      username: 'text-base',
    },
  };

  const displayName = nickname || username;

  if (layout === 'inline') {
    return (
      <span className={`font-medium ${className}`}>
        <span className={sizeClasses[size].nickname}>{displayName}</span>
        <span className={`${sizeClasses[size].username} text-gray-500 ml-1`}>@{username}</span>
      </span>
    );
  }

  return (
    <div className={`flex flex-col ${className}`}>
      <span className={`font-semibold text-gray-900 ${sizeClasses[size].nickname}`}>{displayName}</span>
      <span className={`${sizeClasses[size].username} text-gray-500`}>@{username}</span>
    </div>
  );
}

interface UserDisplayWithAvatarProps {
  avatar?: string | null;
  nickname?: string | null;
  username: string;
  avatarSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  size?: 'sm' | 'md' | 'lg';
  layout?: 'inline' | 'stack';
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function UserDisplayWithAvatar({
  avatar,
  nickname,
  username,
  avatarSize = 'md',
  size = 'md',
  layout = 'stack',
  gap = 'sm',
  className = ''
}: UserDisplayWithAvatarProps) {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4',
  };

  const avatarSizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-9 h-9',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const sizeClasses = {
    sm: {
      nickname: 'text-sm',
      username: 'text-xs',
    },
    md: {
      nickname: 'text-base',
      username: 'text-sm',
    },
    lg: {
      nickname: 'text-lg',
      username: 'text-base',
    },
  };

  const displayName = nickname || username;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className={`flex ${gapClasses[gap]} ${className}`}>
      {avatar ? (
        <img
          src={avatar}
          alt={displayName}
          className={`${avatarSizeClasses[avatarSize]} rounded-full object-cover ring-2 ring-white shadow-sm`}
        />
      ) : (
        <div className={`${avatarSizeClasses[avatarSize]} rounded-full bg-gradient-to-br from-[#6364FF] to-[#8B83FF] text-white flex items-center justify-center font-bold shadow-sm`}>
          {initial}
        </div>
      )}
      {layout === 'inline' ? (
        <span className={`font-medium ${sizeClasses[size].nickname}`}>
          <span>{displayName}</span>
          <span className={`${sizeClasses[size].username} text-gray-500 ml-1`}>@{username}</span>
        </span>
      ) : (
        <div className="flex flex-col">
          <span className={`font-semibold text-gray-900 ${sizeClasses[size].nickname}`}>{displayName}</span>
          <span className={`${sizeClasses[size].username} text-gray-500`}>@{username}</span>
        </div>
      )}
    </div>
  );
}