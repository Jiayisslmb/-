'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';


interface Stat {
  label: string;
  value: number;
  change: number;
}

interface PostingStat {
  date: string;
  posts: number;
  articles: number;
  total: number;
}

interface InteractionStat {
  totalLikes: number;
  totalComments: number;
  totalMessages: number;
  totalInteractions: number;
}

function LineChart({ data, width = 700, height = 260 }: { data: PostingStat[]; width?: number; height?: number }) {
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxVal = Math.max(...data.map(d => d.total), 1);
  const minVal = 0;

  const getX = (i: number) => padding.left + (i / (data.length - 1 || 1)) * chartW;
  const getY = (val: number) => padding.top + chartH - ((val - minVal) / (maxVal - minVal || 1)) * chartH;

  const points = data.map((d, i) => `${getX(i)},${getY(d.total)}`).join(' ');
  const smoothPoints = data.map((d, i) => `${getX(i)},${getY(d.total)}`);

  let pathD = '';
  if (smoothPoints.length >= 2) {
    pathD = `M ${smoothPoints[0]}`;
    for (let i = 1; i < smoothPoints.length; i++) {
      const prev = smoothPoints[i - 1]!.split(',');
      const curr = smoothPoints[i]!.split(',');
      const px = parseFloat(prev[0]!), py = parseFloat(prev[1]!);
      const cx = parseFloat(curr[0]!), cy = parseFloat(curr[1]!);
      const midX = (px + cx) / 2;
      pathD += ` C ${midX},${py} ${midX},${cy} ${cx},${cy}`;
    }
  }

  const areaPath = pathD ? `${pathD} L ${getX(data.length - 1)},${padding.top + chartH} L ${getX(0)},${padding.top + chartH} Z` : '';

  const yTicks = [0, maxVal];
  const xTicks = data.map(d => d.date.slice(5));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[260px]" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6364FF" />
          <stop offset="100%" stopColor="#8B83FF" />
        </linearGradient>
        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#6364FF" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#8B83FF" stopOpacity="0.02" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {yTicks.map(val => (
        <g key={val}>
          <line x1={padding.left} y1={getY(val)} x2={width - padding.right} y2={getY(val)}
            stroke="#f0f0f5" strokeWidth="1" strokeDasharray="4,4" />
          <text x={padding.left - 10} y={getY(val) + 4}
            textAnchor="end" fontSize="11" fill="#9ca3af">{val}</text>
        </g>
      ))}

      {areaPath && (
        <path d={areaPath} fill="url(#areaGradient)" />
      )}

      {pathD && (
        <path d={pathD} fill="none" stroke="url(#lineGradient)" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" />
      )}

      {data.map((d, i) => (
        <g key={i}>
          <circle cx={getX(i)} cy={getY(d.total)} r="4" fill="white"
            stroke="url(#lineGradient)" strokeWidth="2.5" />
          <circle cx={getX(i)} cy={getY(d.total)} r="2" fill="#6364FF">
            <animate attributeName="r" values="2;3;2" dur="2s" repeatCount="indefinite" />
          </circle>
        </g>
      ))}

      {xTicks.map((label, i) => (
        <text key={i} x={getX(i)} y={height - 12} textAnchor="middle"
          fontSize="11" fill="#9ca3af" fontWeight="500">{label}</text>
      ))}
    </svg>
  );
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stat[]>([]);
  const [postingStats, setPostingStats] = useState<PostingStat[]>([]);
  const [interactionStats, setInteractionStats] = useState<InteractionStat | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        if (!token) {
          throw new Error('登录已失效，请重新登录');
        }

        const statsResponse = await fetch(`/api/admin/statistics`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!statsResponse.ok) throw new Error('获取统计数据失败');
        const data = await statsResponse.json();

        const postingResponse = await fetch(`/api/admin/statistics/posting?days=7`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        let postingData: PostingStat[] = [];
        if (postingResponse.ok) {
          const responseData = await postingResponse.json();
          if (Array.isArray(responseData)) {
            postingData = responseData;
          } else if (responseData && Array.isArray(responseData.dailyStats)) {
            postingData = responseData.dailyStats.map((d: any) => ({
              date: d.date,
              posts: d.moments || 0,
              articles: d.articles || 0,
              total: (d.moments || 0) + (d.articles || 0),
            }));
          }
        }
        setPostingStats(postingData);

        const interactionResponse = await fetch(`/api/admin/statistics/interaction`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        let interactionData: InteractionStat | null = null;
        if (interactionResponse.ok) interactionData = await interactionResponse.json();
        setInteractionStats(interactionData);

        const formattedStats: Stat[] = [
          { label: '总用户数', value: data.totalUsers || 0, change: data.todayUsers || 0 },
          { label: '活跃用户', value: data.activeUsers || 0, change: 0 },
          { label: '总动态数', value: data.totalPosts || 0, change: data.todayPosts || 0 },
          { label: '总文章数', value: data.totalArticles || 0, change: data.todayArticles || 0 },
          { label: '圈子总数', value: data.totalCircles || 0, change: data.todayCircles || 0 },
        ];
        setStats(formattedStats);
      } catch (err: any) {
        setError(err.message || '获取统计数据失败');
        console.error('获取统计数据失败:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">加载中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          onClick={() => router.refresh()}
        >重新加载</button>
      </div>
    );
  }

  const totalContent = (interactionStats?.totalLikes || 0) +
                       (interactionStats?.totalComments || 0) +
                       (interactionStats?.totalMessages || 0);

  const contentTypes = [
    { type: '点赞', count: interactionStats?.totalLikes || 0,
      percentage: totalContent > 0 ? Math.round((interactionStats?.totalLikes || 0) / totalContent * 100) : 0,
      gradient: 'from-blue-500 to-cyan-500', icon: '👍' },
    { type: '评论', count: interactionStats?.totalComments || 0,
      percentage: totalContent > 0 ? Math.round((interactionStats?.totalComments || 0) / totalContent * 100) : 0,
      gradient: 'from-green-500 to-emerald-500', icon: '💬' },
    { type: '私信', count: interactionStats?.totalMessages || 0,
      percentage: totalContent > 0 ? Math.round((interactionStats?.totalMessages || 0) / totalContent * 100) : 0,
      gradient: 'from-purple-500 to-pink-500', icon: '✉️' },
  ];

  const maxTotal = Math.max(...postingStats.map(s => s.total), 1);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#6364FF] to-[#8B83FF] rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">数据统计</h1>
        <p className="text-white/80 text-lg">平台数据分析和报表</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
        {stats.map(stat => (
          <Card key={stat.label} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden group">
            <div className="relative">
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${
                stat.label === '总用户数' ? 'from-blue-500 to-cyan-500' :
                stat.label === '活跃用户' ? 'from-green-500 to-emerald-500' :
                stat.label === '总动态数' ? 'from-purple-500 to-pink-500' :
                'from-orange-500 to-red-500'
              }`}></div>
              <div className="p-6 pt-7">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600 font-medium">{stat.label}</span>
                  <span className="text-2xl opacity-70 group-hover:opacity-100 transition-opacity">
                    {stat.label === '总用户数' ? '👥' : stat.label === '活跃用户' ? '✨' : stat.label === '总动态数' ? '💬' : '📄'}
                  </span>
                </div>
                <p className={`text-4xl font-bold bg-gradient-to-r ${
                  stat.label === '总用户数' ? 'from-blue-500 to-cyan-500' :
                  stat.label === '活跃用户' ? 'from-green-500 to-emerald-500' :
                  stat.label === '总动态数' ? 'from-purple-500 to-pink-500' :
                  'from-orange-500 to-red-500'
                } bg-clip-text text-transparent`}>{stat.value.toLocaleString()}</p>
                <p className={`text-sm mt-2 ${stat.change > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                  {stat.change > 0 ? `今日新增 +${stat.change}` : '暂无新增'}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 tracking-tight">内容发布趋势（最近7天）</h3>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-gradient-to-r from-[#6364FF] to-[#8B83FF] rounded"></span>发布总量</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-gradient-to-t from-[#6364FF]/60 to-[#8B83FF]/40"></span>每日统计</span>
            </div>
          </div>

          {postingStats.length > 0 ? (
            <>
              <LineChart data={postingStats} />

              <div className="mt-4 flex justify-around text-gray-600 text-sm border-t border-gray-50 pt-3">
                {postingStats.map((stat, i) => (
                  <div key={i} className="flex flex-col items-center gap-0.5 min-w-[36px]">
                    <span className="font-semibold text-gray-800 text-sm">{stat.total}</span>
                    <span className="text-xs text-gray-400">{stat.date.slice(5)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-4 md:grid-cols-7 gap-2">
                {postingStats.map((stat, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-2.5 text-center group hover:bg-[#F0EFFF]/30 transition-colors duration-200">
                    <div
                      className="w-full bg-gradient-to-t from-[#6364FF] to-[#8B83FF] rounded-md transition-all duration-300 group-hover:from-[#4F46E5] group-hover:to-[#6364FF]"
                      style={{ height: `${(stat.total / maxTotal) * 48}px`, minHeight: stat.total > 0 ? '6px' : '0' }}
                      title={`动态: ${stat.posts}, 文章: ${stat.articles}`}
                    ></div>
                    <div className="mt-1.5 space-y-0.5">
                      <div className="text-[10px] text-gray-400">📝{stat.articles}</div>
                      <div className="text-[10px] text-gray-400">💬{stat.posts}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">暂无发布数据</div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-5">
        <Card className="border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6 tracking-tight">互动类型分布</h3>
            <div className="space-y-5">
              {contentTypes.map(item => (
                <div key={item.type}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-2 text-gray-700 font-medium"><span>{item.icon}</span>{item.type}</span>
                    <span className="text-gray-600 font-semibold">{item.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div className={`bg-gradient-to-r ${item.gradient} h-2.5 rounded-full transition-all duration-500`}
                      style={{ width: `${item.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
            {interactionStats && (
              <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-gray-600 text-sm">总互动数: <span className="font-bold text-[#6364FF]">{interactionStats.totalInteractions}</span></p>
              </div>
            )}
          </div>
        </Card>

        <Card className="border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6 tracking-tight">平台概览</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
                <span className="text-gray-700 font-medium">👥 圈子总数</span>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">{stats.find(s => s.label === '圈子总数')?.value || 0}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                <span className="text-gray-700 font-medium">🔄 总互动数</span>
                <span className="text-2xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">{interactionStats?.totalInteractions || 0}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                <span className="text-gray-700 font-medium">📝 内容总数</span>
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                  {(stats[2]?.value || 0) + (stats[3]?.value || 0)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
