'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export const IPFS_GATEWAYS = [
  'https://blush-managing-swallow-349.mypinata.cloud/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
];

const currentGatewayIndex = 0;

export const PINATA_CONFIG = {
  gateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs/',
};

// 使用相对路径，依赖Next.js的API代理

interface IPFSContextType {
  isConnected: boolean;
  upload: (file: File) => Promise<{ cid: string; url: string }>;
  fetch: (cid: string) => Promise<Blob | null>;
}

const IPFSContext = createContext<IPFSContextType | undefined>(undefined);

const uploadToBackend = async (file: File): Promise<{ cid: string; url: string }> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('请先登录');
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/ipfs/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.error || `上传失败: ${response.status}`);
  }

  const result = await response.json();
  return {
    cid: result.cid,
    url: result.url,
  };
};

const uploadToLocal = async (file: File): Promise<{ cid: string; url: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const base64 = reader.result as string;
        
        // 尝试存储到 localStorage
        try {
          const hash = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem(`ipfs:${hash}`, base64);
          resolve({ cid: hash, url: base64 });
        } catch (storageError) {
          console.warn('localStorage 配额超限，直接返回 base64 数据');
          // 配额超限时，直接返回 base64 数据作为 cid
          resolve({ cid: base64, url: base64 });
        }
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
};

const fetchFromIPFS = async (cid: string): Promise<Blob | null> => {
  for (const gateway of IPFS_GATEWAYS) {
    try {
      const response = await fetch(`${gateway}${cid}`, {
        method: 'GET',
      });
      
      if (response.ok) {
        return await response.blob();
      }
    } catch (error) {
      console.warn(`网关 ${gateway} 获取失败:`, error);
    }
  }
  
  return null;
};

export function IPFSProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('/api/ipfs/test');
        if (response.ok) {
          const data = await response.json();
          setIsConnected(data.connected);
          if (data.connected) {
            console.log('IPFS服务连接成功');
          }
        }
      } catch (error) {
        console.warn('IPFS服务连接测试失败:', error);
        setIsConnected(false);
      }
    };

    checkConnection();
  }, []);

  const upload = async (file: File) => {
    try {
      return await uploadToBackend(file);
    } catch (error) {
      console.warn('后端上传失败，使用本地存储:', error);
      return uploadToLocal(file);
    }
  };

  const fetchFromIPFSGateway = async (cid: string) => {
    return fetchFromIPFS(cid);
  };

  const value: IPFSContextType = {
    isConnected,
    upload,
    fetch: fetchFromIPFSGateway
  };

  return React.createElement(
    IPFSContext.Provider,
    { value },
    children
  );
}

export function useIPFS() {
  const context = useContext(IPFSContext);
  if (context === undefined) {
    throw new Error('useIPFS must be used within an IPFSProvider');
  }
  return context;
}

export const uploadToIPFS = async (file: File): Promise<{ cid: string; url: string }> => {
  try {
    console.log('尝试上传到后端IPFS服务:', file.name);
    const result = await uploadToBackend(file);
    console.log('后端上传成功:', result);
    return result;
  } catch (error: any) {
    console.warn('后端上传失败，使用本地存储:', error.message);
    try {
      const localResult = await uploadToLocal(file);
      console.log('本地存储成功:', localResult);
      return localResult;
    } catch (localError) {
      console.error('本地存储也失败:', localError);
      throw new Error('上传失败: 后端服务和本地存储都无法使用');
    }
  }
};

export const fetchFromIPFSExport = async (cid: string): Promise<Blob | null> => {
  return fetchFromIPFS(cid);
};

export const getIPFSUrl = (cid: string | undefined): string => {
  if (!cid) return '';
  
  // 检查是否是base64数据
  if (cid.startsWith('data:')) {
    return cid;
  }
  
  // 检查是否是完整的 URL
  if (cid.startsWith('http://') || cid.startsWith('https://')) {
    // 修复缺少 /ipfs/ 路径的问题
    if (cid.includes('pinata.cloud') && !cid.includes('/ipfs/')) {
      const parts = cid.split('/');
      const lastPart = parts[parts.length - 1];
      if (lastPart && lastPart.length > 40) { // 简单判断是否是 CID
        return `${parts.slice(0, -1).join('/')}/ipfs/${lastPart}`;
      }
    }
    return cid;
  }
  
  const actualCid = cid.split('?')[0];
  const queryPart = cid.includes('?') ? cid.substring(cid.indexOf('?')) : '';
  
  // 检查是否是本地存储的图片
  if (actualCid.startsWith('local_')) {
    const localData = localStorage.getItem(`ipfs:${actualCid}`);
    if (localData) {
      return localData;
    }
    // 如果localStorage中没有数据，检查是否是直接存储的base64数据
    if (actualCid.includes(',')) {
      // 可能是直接存储的base64数据
      return actualCid;
    }
    // 如果localStorage中没有数据，返回空字符串
    return '';
  }
  
  // 检查是否是直接存储的base64数据（没有local_前缀）
  if (actualCid.includes(',')) {
    return actualCid;
  }
  
  // 优先使用Pinata网关（第一个），确保所有CID都使用同一个网关
  const gateway = IPFS_GATEWAYS[0];
  return `${gateway}${actualCid}${queryPart}`;
};

export const uploadMultipleToIPFS = async (files: File[]): Promise<{ cid: string; url: string; name: string }[]> => {
  const results = await Promise.all(
    files.map(async (file) => {
      const result = await uploadToIPFS(file);
      return { ...result, name: file.name };
    })
  );
  return results;
};

export const getPinataUsage = async (): Promise<any> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('请先登录');
  }

  const response = await fetch('/api/ipfs/usage', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('获取使用情况失败');
  }

  return response.json();
};
