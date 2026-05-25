'use client';

import { useState } from 'react';
import { getIPFSUrl, IPFS_GATEWAYS } from '@/lib/ipfs';

interface IPFSImageViewerProps {
  cid: string;
  alt?: string;
  className?: string;
}

export default function IPFSImageViewer({ cid, alt = 'IPFS 图片', className = '' }: IPFSImageViewerProps) {
  const [gatewayIndex, setGatewayIndex] = useState(0);
  const [hasError, setHasError] = useState(false);

  const gateways = [
    IPFS_GATEWAYS[0],
    'https://gateway.pinata.cloud/ipfs/',
    'https://ipfs.io/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://dweb.link/ipfs/',
  ].filter(Boolean) as string[];

  const currentUrl = getIPFSUrl(cid);
  const fallbackUrl = hasError && gatewayIndex < gateways.length
    ? `${gateways[gatewayIndex]}${cid}`
    : currentUrl;

  const handleError = () => {
    if (gatewayIndex < gateways.length - 1) {
      setGatewayIndex((i) => i + 1);
      setHasError(true);
    }
  };

  if (!cid) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center text-gray-400 text-sm ${className}`}>
        无图片
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={hasError ? fallbackUrl : currentUrl}
        alt={alt}
        onError={handleError}
        className="w-full h-full object-cover rounded-lg"
        loading="lazy"
      />
      {hasError && gatewayIndex > 0 && (
        <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
          网关 {gatewayIndex + 1}
        </span>
      )}
    </div>
  );
}
