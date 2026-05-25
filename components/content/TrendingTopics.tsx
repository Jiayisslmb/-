'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';


interface TrendingTopic {
  id: string;
  name: string;
  count: number;
  postCount?: number;
  growth?: number;
}

export default function TrendingTopics() {
  const [trends, setTrends] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/topics/trending?limit=10`);

        if (response.ok) {
          const text = await response.text();
          if (text) {
            const data = JSON.parse(text);
            setTrends(data);
          }
        }
      } catch (err) {
        console.error('获取热门话题失败:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrends();
  }, []);

  if (loading) {
    return (
      <Card className="border-gray-200/80 shadow-sm">
        <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-[#F9FAFB] to-white">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            🔥 热门话题
            <span className="text-xs font-normal text-gray-500 bg-white px-2 py-0.5 rounded-full">实时</span>
          </h3>
        </div>
        <div className="p-5">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-3 p-3 rounded-xl bg-gray-50/50">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm ${
                  i <= 3 ? 'bg-gradient-to-br from-[#6364FF]/20 to-[#8B83FF]/20' : 'bg-gray-100'
                }`}>
                  <span className={i <= 3 ? 'text-[#6364FF]' : 'text-gray-400'}>{i}</span>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (trends.length === 0) {
    return (
      <Card className="border-gray-200/80 shadow-sm">
        <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-[#F9FAFB] to-white">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            🔥 热门话题
            <span className="text-xs font-normal text-gray-500 bg-white px-2 py-0.5 rounded-full">实时</span>
          </h3>
        </div>
        <div className="p-8 text-center">
          <div className="text-5xl mb-3">#️⃣</div>
          <p className="text-gray-600 text-sm font-medium mb-1">暂无热门话题</p>
          <p className="text-gray-400 text-xs">发布帖子时创建话题吧</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200/80 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
      <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-[#F9FAFB] to-white">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            🔥 热门话题
            <span className="text-xs font-normal text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-100">
              实时更新
            </span>
          </h3>
        </div>
      </div>

      <div className="divide-y divide-gray-50/50">
        {trends.slice(0, 8).map((trend, index) => (
          <Link
            key={trend.id}
            href={`/topic/${encodeURIComponent(trend.name)}`}
            className="block p-4 hover:bg-[#F0EFFF]/30 transition-all duration-200 group"
          >
            <div className="flex justify-between items-start gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 transition-all duration-200 ${
                  index < 3
                    ? 'bg-gradient-to-br from-[#6364FF] to-[#8B83FF] text-white shadow-sm group-hover:shadow-md group-hover:scale-110'
                    : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                }`}>
                  {index + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 group-hover:text-[#6364FF] transition-colors duration-200 truncate mb-1">
                    #{trend.name}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      {trend.postCount || 0}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                    <span>讨论</span>
                  </div>
                </div>
              </div>

              {trend.growth !== undefined && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  trend.growth > 0
                    ? 'bg-green-50 text-green-600'
                    : trend.growth < 0
                      ? 'bg-red-50 text-red-600'
                      : 'bg-gray-50 text-gray-500'
                }`}>
                  {trend.growth > 0 && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  )}
                  {trend.growth < 0 && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  )}
                  {Math.abs(trend.growth)}%
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      <Link
        href="/search"
        className="block p-4 bg-gradient-to-r from-[#F0EFFF] to-white border-t border-gray-100 text-center text-[#6364FF] hover:text-[#5558DD] hover:from-[#EDE9FE] hover:to-white transition-all duration-200 font-semibold text-sm group"
      >
        <span className="group-hover:inline-flex group-hover:items-center group-hover:gap-1">
          探索更多话题
          <svg className="w-4 h-4 inline-block ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </span>
      </Link>
    </Card>
  );
}
