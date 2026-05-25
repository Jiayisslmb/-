'use client';

import { getIPFSUrl, IPFS_GATEWAYS } from '@/lib/ipfs';

interface IPFSFileInfoProps {
  cid: string;
  fileName?: string;
  fileSize?: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function IPFSFileInfo({ cid, fileName, fileSize }: IPFSFileInfoProps) {
  const shortCid = cid.length > 20 ? `${cid.slice(0, 8)}...${cid.slice(-8)}` : cid;
  const gatewayUrl = getIPFSUrl(cid);

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-gray-500">CID</span>
        <span className="font-mono text-xs text-gray-800" title={cid}>{shortCid}</span>
      </div>

      {fileName && (
        <div className="flex items-center justify-between">
          <span className="text-gray-500">文件名</span>
          <span className="text-gray-800 truncate max-w-[200px]">{fileName}</span>
        </div>
      )}

      {fileSize !== undefined && (
        <div className="flex items-center justify-between">
          <span className="text-gray-500">大小</span>
          <span className="text-gray-800">{formatBytes(fileSize)}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-gray-500">网关</span>
        <span className="text-[#6364FF] text-xs font-mono truncate max-w-[200px]">
          {gatewayUrl || IPFS_GATEWAYS[0]}
        </span>
      </div>

      <button
        onClick={() => gatewayUrl && navigator.clipboard.writeText(gatewayUrl)}
        className="w-full mt-1 text-xs px-3 py-1.5 bg-[#6364FF] text-white rounded hover:bg-[#5558DD] transition"
      >
        复制网关 URL
      </button>
    </div>
  );
}
