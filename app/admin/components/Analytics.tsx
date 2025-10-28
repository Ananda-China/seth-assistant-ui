"use client";

import { useState, useEffect } from 'react';

interface AnalyticsData {
  period: string;
  overview: {
    user_growth: {
      total: number;
      new: number;
      growth_rate: string;
    };
    conversation_activity: {
      total: number;
      new: number;
      avg_per_user: string;
      avg_messages: string;
    };
    message_stats: {
      total: number;
      new: number;
      avg_per_conversation: string;
      total_tokens: number;
      recent_tokens: number;
      avg_tokens_per_message: string;
    };
    user_engagement: {
      active_users: number;
      recent_active: number;
      engagement_rate: string;
    };
  };
  trends: {
    daily_data: Array<{
      date: string;
      users: number;
      conversations: number;
      messages: number;
    }>;
  };
  top_metrics: Array<{
    label: string;
    value: string | number;
    change: string;
    change_type: 'positive' | 'negative' | 'neutral';
  }>;
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [useSupabase, setUseSupabase] = useState(true); // 默认使用Supabase
  const [error, setError] = useState<string | null>(null);


  
  // 获取统计数据
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 根据配置选择API端点
      const apiEndpoint = useSupabase ? '/api/admin/analytics-supabase' : '/api/admin/analytics';
      const response = await fetch(`${apiEndpoint}?period=${period}`);
      
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        const errorText = await response.text();
        setError(`API请求失败: ${errorText}`);
        console.error('Analytics API error:', errorText);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setError(`网络错误: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  // 时间段变化时重新获取数据
  useEffect(() => {
    fetchAnalytics();
  }, [period, useSupabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#8A94B3]">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#C8B6E2]">数据统计</h1>
            <p className="text-[#8A94B3] mt-1">实时监控业务关键指标</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* 数据源切换 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#8A94B3]">数据源：</span>
              <select
                value={useSupabase ? 'supabase' : 'local'}
                onChange={(e) => setUseSupabase(e.target.value === 'supabase')}
                className="px-3 py-2 bg-[#2E335B] border-none rounded-lg text-[#EAEBF0]"
              >
                <option value="supabase">Supabase数据库</option>
                <option value="local">本地文件</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#8A94B3]">时间段：</span>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="px-3 py-2 bg-[#2E335B] border-none rounded-lg text-[#EAEBF0]"
              >
                <option value="today">今天</option>
                <option value="yesterday">昨天</option>
                <option value="7d">最近7天</option>
                <option value="14d">最近14天</option>
                <option value="30d">最近30天</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6">
          <div className="text-red-400 font-semibold mb-2">❌ 数据加载失败</div>
          <div className="text-red-300 text-sm mb-4">{error}</div>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#8A94B3]">暂无数据</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 时间段选择和数据源切换 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#C8B6E2]">数据统计</h1>
          <p className="text-[#8A94B3] mt-1">实时监控业务关键指标</p>
          <div className="text-xs text-[#8A94B3] mt-1">
            数据源: {useSupabase ? 'Supabase数据库' : '本地文件'}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* 数据源切换 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#8A94B3]">数据源：</span>
            <select
              value={useSupabase ? 'supabase' : 'local'}
              onChange={(e) => setUseSupabase(e.target.value === 'supabase')}
              className="px-3 py-2 bg-[#2E335B] border-none rounded-lg text-[#EAEBF0]"
            >
              <option value="supabase">Supabase数据库</option>
              <option value="local">本地文件</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#8A94B3]">时间段：</span>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 bg-[#2E335B] border-none rounded-lg text-[#EAEBF0]"
            >
              <option value="today">今天</option>
              <option value="yesterday">昨天</option>
              <option value="7d">最近7天</option>
              <option value="14d">最近14天</option>
              <option value="30d">最近30天</option>
            </select>
          </div>
        </div>
      </div>

      {/* 关键指标卡片 - 今日新增数据 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-red-900/30 to-red-800/20 p-6 rounded-xl border border-red-500/30">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-red-400">{data.overview.user_growth.new}</div>
              <div className="text-sm text-[#8A94B3]">今日新增用户</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-red-400">📈</div>
              <div className="text-xs text-[#8A94B3]">新增</div>
            </div>
          </div>
          <div className="mt-3 text-xs text-[#8A94B3]">
            总用户数：{data.overview.user_growth.total}
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-900/30 to-red-800/20 p-6 rounded-xl border border-red-500/30">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-red-400">{data.overview.conversation_activity.new}</div>
              <div className="text-sm text-[#8A94B3]">今日对话数</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-red-400">💬</div>
              <div className="text-xs text-[#8A94B3]">新增</div>
            </div>
          </div>
          <div className="mt-3 text-xs text-[#8A94B3]">
            总对话数：{data.overview.conversation_activity.total.toLocaleString()}
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-900/30 to-red-800/20 p-6 rounded-xl border border-red-500/30">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-red-400">{data.overview.message_stats.new}</div>
              <div className="text-sm text-[#8A94B3]">今日消息数</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-red-400">✉️</div>
              <div className="text-xs text-[#8A94B3]">新增</div>
            </div>
          </div>
          <div className="mt-3 text-xs text-[#8A94B3]">
            总消息数：{data.overview.message_stats.total.toLocaleString()}
          </div>
        </div>

        <div className="bg-[#1A1D33] p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-[#C8B6E2]">{data.overview.user_engagement.active_users}</div>
              <div className="text-sm text-[#8A94B3]">活跃用户</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-yellow-400">{data.overview.user_engagement.engagement_rate}%</div>
              <div className="text-xs text-[#8A94B3]">参与率</div>
            </div>
          </div>
          <div className="mt-3 text-xs text-[#8A94B3]">
            最近活跃：{data.overview.user_engagement.recent_active}
          </div>
        </div>
      </div>

      {/* 顶部指标概览 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.top_metrics.map((metric, index) => (
          <div key={index} className="bg-[#1A1D33] p-4 rounded-xl">
            <div className="text-sm text-[#8A94B3] mb-1">{metric.label}</div>
            <div className="text-2xl font-bold text-[#C8B6E2] mb-1">{metric.value}</div>
            <div className={`text-sm font-medium ${
              metric.change_type === 'positive' ? 'text-green-400' : 
              metric.change_type === 'negative' ? 'text-red-400' : 
              'text-[#8A94B3]'
            }`}>
              {metric.change}
            </div>
          </div>
        ))}
      </div>

      {/* 用户参与度分析 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1A1D33] p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-[#C8B6E2] mb-4">用户参与度分析</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[#EAEBF0]">活跃用户</span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-[#2E335B] rounded-full h-2">
                  <div 
                    className="bg-[#C8B6E2] h-2 rounded-full" 
                    style={{ width: `${Math.min((data.overview.user_engagement.active_users / data.overview.user_growth.total) * 100, 100)}%` }}
                  ></div>
                </div>
                <span className="text-sm text-[#8A94B3]">{data.overview.user_engagement.active_users}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#EAEBF0]">最近活跃</span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-[#2E335B] rounded-full h-2">
                  <div 
                    className="bg-[#C8B6E2] h-2 rounded-full" 
                    style={{ width: `${Math.min((data.overview.user_engagement.recent_active / data.overview.user_growth.total) * 100, 100)}%` }}
                  ></div>
                </div>
                <span className="text-sm text-[#8A94B3]">{data.overview.user_engagement.recent_active}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#EAEBF0]">参与率</span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-[#2E335B] rounded-full h-2">
                  <div 
                    className="bg-[#C8B6E2] h-2 rounded-full" 
                    style={{ width: `${Math.min(parseFloat(data.overview.user_engagement.engagement_rate), 100)}%` }}
                  ></div>
                </div>
                <span className="text-sm text-[#8A94B3]">{data.overview.user_engagement.engagement_rate}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#1A1D33] p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-[#C8B6E2] mb-4">Token使用分析</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[#EAEBF0]">总Token使用</span>
              <span className="text-[#C8B6E2] font-semibold">{data.overview.message_stats.total_tokens.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#EAEBF0]">最近Token使用</span>
              <span className="text-[#C8B6E2] font-semibold">{data.overview.message_stats.recent_tokens.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#EAEBF0]">平均每消息Token</span>
              <span className="text-[#C8B6E2] font-semibold">{data.overview.message_stats.avg_tokens_per_message}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 趋势图表 */}
      <div className="bg-[#1A1D33] p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-[#C8B6E2] mb-4">趋势图表</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-[#8A94B3]">新增用户趋势</h4>
            <div className="h-32 bg-[#2E335B] rounded-lg flex items-end justify-around p-2">
              {data.trends.daily_data.map((day, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div 
                    className="bg-[#C8B6E2] rounded-t w-6"
                    style={{ height: `${Math.max((day.users / Math.max(...data.trends.daily_data.map(d => d.users))) * 100, 4)}px` }}
                  ></div>
                  <span className="text-xs text-[#8A94B3] mt-1">{day.date.split('-')[2]}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-[#8A94B3]">对话数量趋势</h4>
            <div className="h-32 bg-[#2E335B] rounded-lg flex items-end justify-around p-2">
              {data.trends.daily_data.map((day, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div 
                    className="bg-[#C8B6E2] rounded-t w-6"
                    style={{ height: `${Math.max((day.conversations / Math.max(...data.trends.daily_data.map(d => d.conversations))) * 100, 4)}px` }}
                  ></div>
                  <span className="text-xs text-[#8A94B3] mt-1">{day.date.split('-')[2]}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-[#8A94B3]">消息数量趋势</h4>
            <div className="h-32 bg-[#2E335B] rounded-lg flex items-end justify-around p-2">
              {data.trends.daily_data.map((day, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div 
                    className="bg-[#C8B6E2] rounded-t w-6"
                    style={{ height: `${Math.max((day.messages / Math.max(...data.trends.daily_data.map(d => d.messages))) * 100, 4)}px` }}
                  ></div>
                  <span className="text-xs text-[#8A94B3] mt-1">{day.date.split('-')[2]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 数据源信息 */}
      <div className="text-center text-xs text-[#8A94B3]">
        最后更新: {new Date().toLocaleString('zh-CN')} | 
        数据源: {useSupabase ? 'Supabase数据库' : '本地文件'} | 
        版本 1.0.0
      </div>
    </div>
  );
}
