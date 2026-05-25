// service-worker.js

const CACHE_NAME = 'decentralized-social-platform-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/vercel.svg',
  '/next.svg',
  '/images',
  '/_next/static',
  '/_next/image',
  '/api/ipfs/test',
  '/api/users/profile'
];

// 安装Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: 缓存静态资源');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// 激活Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.filter((cacheName) => {
            return cacheName !== CACHE_NAME;
          }).map((cacheName) => {
            console.log('Service Worker: 删除旧缓存', cacheName);
            return caches.delete(cacheName);
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// 拦截网络请求
self.addEventListener('fetch', (event) => {
  // 忽略非GET请求和浏览器扩展请求
  if (event.request.method !== 'GET' || event.request.url.includes('chrome-extension:')) {
    return;
  }

  // 忽略API请求中的某些路径
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/') && !STATIC_ASSETS.includes(url.pathname)) {
    // 对于API请求，尝试网络请求，失败后返回缓存
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // 缓存成功的API响应
          if (response && response.ok) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
          }
          return response;
        })
        .catch(() => {
          // 网络失败时返回缓存
          return caches.match(event.request);
        })
    );
  } else {
    // 对于静态资源，优先从缓存获取
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // 缓存未命中，从网络获取
          return fetch(event.request)
            .then((response) => {
              // 缓存成功的响应
              if (response && response.ok) {
                const responseToCache = response.clone();
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(event.request, responseToCache);
                  });
              }
              return response;
            });
        })
    );
  }
});

// 后台同步
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

// 同步消息的函数
async function syncMessages() {
  try {
    const offlineMessages = await getOfflineMessages();
    for (const message of offlineMessages) {
      await sendMessage(message);
    }
    await clearOfflineMessages();
  } catch (error) {
    console.error('后台同步失败:', error);
  }
}

// 获取离线消息
async function getOfflineMessages() {
  // 从IndexedDB获取离线消息
  // 这里需要实现IndexedDB操作
  return [];
}

// 发送消息
async function sendMessage(message) {
  // 发送消息到服务器
  // 这里需要实现消息发送逻辑
  return true;
}

// 清除离线消息
async function clearOfflineMessages() {
  // 清除IndexedDB中的离线消息
  // 这里需要实现IndexedDB操作
  return true;
}
