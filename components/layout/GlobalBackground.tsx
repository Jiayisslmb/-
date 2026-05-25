'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { getIPFSUrl } from '@/lib/ipfs';

export default function GlobalBackground() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [backgroundStyle, setBackgroundStyle] = useState<React.CSSProperties>({
    backgroundColor: '#ffffff',
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      const globalBackgroundCid = user.globalBackgroundCid;
      const globalBackgroundColor = user.globalBackgroundColor;
      
      if (globalBackgroundCid) {
        const imageUrl = getIPFSUrl(globalBackgroundCid);
        setBackgroundStyle({
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          backgroundRepeat: 'no-repeat',
        });
      } else if (globalBackgroundColor) {
        setBackgroundStyle({
          backgroundColor: globalBackgroundColor,
        });
      } else {
        setBackgroundStyle({
          backgroundColor: '#ffffff',
        });
      }
    } else {
      setBackgroundStyle({
        backgroundColor: '#ffffff',
      });
    }
  }, [isAuthenticated, user?.globalBackgroundCid, user?.globalBackgroundColor]);

  return (
    <div
      className="fixed inset-0 -z-10 transition-all duration-300"
      style={backgroundStyle}
    >
      {isAuthenticated && user?.globalBackgroundCid && (
        <div className="absolute inset-0 bg-black/10" />
      )}
    </div>
  );
}
