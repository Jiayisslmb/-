'use client';

import { useP2P } from './P2PProvider';

export default function P2PStatus() {
  const { peerId, isReady, peerCount, addresses, error } = useP2P();

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-full ${isReady ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="font-semibold text-sm">P2P {isReady ? '已连接' : '未连接'}</span>
      </div>

      {error && (
        <p className="text-xs text-red-500 bg-red-50 rounded px-2 py-1">{error}</p>
      )}

      {isReady && (
        <>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div>
              <span className="text-gray-400">Peer ID</span>
              <p className="font-mono truncate" title={peerId ?? ''}>
                {peerId ? `${peerId.slice(0, 10)}...${peerId.slice(-6)}` : '-'}
              </p>
            </div>
            <div>
              <span className="text-gray-400">已连接节点</span>
              <p className="font-semibold text-[#6364FF]">{peerCount}</p>
            </div>
          </div>

          {addresses.length > 0 && (
            <div className="text-xs text-gray-500 border-t border-gray-100 pt-2">
              <span className="text-gray-400">监听地址</span>
              {addresses.map((addr, i) => (
                <p key={i} className="font-mono truncate">{addr}</p>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
