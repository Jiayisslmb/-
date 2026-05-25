// 图片工具 — 统一处理 IPFS CID 和占位符

const IPFS_GATEWAYS = [
  'https://gateway.pinata.cloud/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
];

export function getIPFSUrl(cid: string | null | undefined): string {
  if (!cid) return '';
  if (cid.startsWith('http')) return cid;
  if (cid.startsWith('/')) return cid;
  return `${IPFS_GATEWAYS[0]}${cid}`;
}

export function getImageUrl(
  src: string | null | undefined,
  options?: { width?: number; height?: number; fallback?: string }
): string {
  if (!src) return options?.fallback ?? '/placeholder.svg';
  if (src.startsWith('http') || src.startsWith('/')) return src;
  // Assume it's a CID
  return getIPFSUrl(src);
}

export function imageProps(src: string | null | undefined, width = 600, height = 400) {
  return {
    src: getImageUrl(src),
    width,
    height,
    alt: '',
    placeholder: 'blur' as const,
    blurDataURL: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/+F9PQAI8wNPvd7POQAAAABJRU5ErkJggg==',
  };
}
