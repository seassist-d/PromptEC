'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useCounterAnimation } from '@/hooks/useCounterAnimation';

interface SalesReportData {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    totalPlatformFee: number;
    totalPaymentFee: number;
    totalSellerPayout: number;
    platformRevenue: number;
    period: string;
    growthRate?: {
      revenue: number;
      orders: number;
      averageOrderValue: number;
      platformRevenue: number;
    };
    previousPeriod?: {
      totalRevenue: number;
      totalOrders: number;
      averageOrderValue: number;
      platformRevenue: number;
    };
  };
  sellerSales: Array<{
    display_name: string;
    user_id: string;
    total_revenue: number;
    order_count: number;
    rank: number;
  }>;
  promptSales: Array<{
    prompt_id: string;
    title: string;
    total_sales: number;
    order_count: number;
    average_price: number;
    rank: number;
  }>;
  trends: Array<{
    date: string;
    revenue: number;
    dateKey: string;
  }>;
  breakdown: {
    totalSales: number;
    platformFee: number;
    paymentFee: number;
    sellerNet: number;
  };
}

export default function AdminReportsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SalesReportData | null>(null);
  const [period, setPeriod] = useState('30days');
  const [selectedSellerId, setSelectedSellerId] = useState<string>('');
  const [sellersList, setSellersList] = useState<Array<{ user_id: string; display_name: string }>>([]);

  useEffect(() => {
    checkAdminAndLoadData();
  }, [period, selectedSellerId]);

  const checkAdminAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      if (profile?.role !== 'admin') {
        router.push('/');
        return;
      }

      // 出品者リストを取得
      const { data: sellers } = await supabase
        .from('user_profiles')
        .select('user_id, display_name')
        .in('role', ['seller', 'admin'])
        .order('display_name', { ascending: true });
      
      if (sellers) {
        setSellersList(sellers);
      }

      await loadReportData();
    } catch (error) {
      console.error('権限チェックエラー:', error);
      toast.error('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const loadReportData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ period });
      if (selectedSellerId) {
        params.append('seller_id', selectedSellerId);
      }
      const response = await fetch(`/api/admin/reports/sales?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('レポートデータの取得に失敗しました');
      }
      
      const reportData = await response.json();
      setData(reportData);
    } catch (error: any) {
      console.error('レポート読み込みエラー:', error);
      toast.error(error.message || 'データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // CSV出力
  const exportToCSV = (type: 'sellers' | 'prompts' | 'summary') => {
    if (!data) return;

    let csv = '';
    let filename = '';

    if (type === 'summary') {
      csv = [
        ['項目', '金額（円）'],
        ['総売上', data.summary.totalRevenue.toString()],
        ['注文数', data.summary.totalOrders.toString()],
        ['平均単価', data.summary.averageOrderValue.toString()],
        ['プラットフォーム手数料', data.summary.totalPlatformFee.toString()],
        ['決済手数料', data.summary.totalPaymentFee.toString()],
        ['出品者への支払', data.summary.totalSellerPayout.toString()],
        ['プラットフォーム収益', data.summary.platformRevenue.toString()],
      ].map(row => row.join(',')).join('\n');
      filename = `売上サマリー-${period}.csv`;
    } else if (type === 'sellers') {
      csv = [
        ['ランク', '出品者名', '売上（円）', '注文数'],
        ...data.sellerSales.map(seller => [
          seller.rank.toString(),
          seller.display_name,
          seller.total_revenue.toString(),
          seller.order_count.toString()
        ])
      ].map(row => row.join(',')).join('\n');
      filename = `出品者売上-${period}.csv`;
    } else {
      csv = [
        ['ランク', 'プロンプト名', '売上（円）', '注文数', '平均価格（円）'],
        ...data.promptSales.map(prompt => [
          prompt.rank.toString(),
          `"${prompt.title.replace(/"/g, '""')}"`,
          prompt.total_sales.toString(),
          prompt.order_count.toString(),
          prompt.average_price.toString()
        ])
      ].map(row => row.join(',')).join('\n');
      filename = `プロンプト売上-${period}.csv`;
    }

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSVファイルをダウンロードしました');
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="mb-4 space-x-4 flex flex-wrap items-center">
            <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              トップページ
            </Link>
            <span className="text-gray-400">|</span>
            <Link href="/admin" className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 了中国 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              ダッシュボードに戻る
            </Link>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">売上レポート</h1>
              <p className="mt-2 text-sm text-gray-600">総合的な売上状況と統計</p>
            </div>
            
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">期間:</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              >
                <option value="7days">過去7日間</option>
                <option value="30days">過去30日間</option>
                <option value="month">過去1ヶ月</option>
                <option value="year">過去1年</option>
              </select>

              <select
                value={selectedSellerId}
                onChange={(e) => setSelectedSellerId(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[200px]"
                disabled={loading}
              >
                <option value="">出品者: すべて</option>
                {sellersList.map((seller) => (
                  <option key={seller.user_id} value={seller.user_id}>
                    {seller.display_name || '未設定'}
                  </option>
                ))}
              </select>

              {(selectedSellerId) && (
                <button
                  onClick={() => {
                    setSelectedSellerId('');
                    toast.success('フィルタをリセットしました');
                  }}
                  className="px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors flex items-center gap-1 border border-red-300 rounded-md"
                  disabled={loading}
                  title="フィルタをリセット"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  リセット
                </button>
              )}

              {data && (
                <button
                  onClick={() => exportToCSV('summary')}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm flex items-center gap-2"
                  disabled={loading}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  サマリーCSV
                </button>
              )}
            </div>
          </div>
        </div>

        {data && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard 
                title="総売上" 
                value={`¥${data.summary.totalRevenue.toLocaleString()}`} 
                icon="💰" 
                description="期間中の総売上"
                trend={data.summary.growthRate?.revenue}
              />
              <StatCard 
                title="注文数" 
                value={data.summary.totalOrders.toLocaleString()} 
                icon="🛒" 
                description="完了した注文数"
                trend={data.summary.growthRate?.orders}
              />
              <StatCard 
                title="平均単価" 
                value={`¥${data.summary.averageOrderValue.toLocaleString()}`} 
                icon="📊" 
                description="注文あたりの平均金額"
                trend={data.summary.growthRate?.averageOrderValue}
              />
              <StatCard 
                title="プラットフォーム収益" 
                value={`¥${data.summary.platformRevenue.toLocaleString()}`} 
                icon="💼" 
                description="手数料収入"
                trend={data.summary.growthRate?.platformRevenue}
              />
            </div>

            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">売上内訳</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <BreakdownItem label="総売上" value={data.breakdown.totalSales} />
                <BreakdownItem label="プラットフォーム手数料" value={data.breakdown.platformFee} />
                <BreakdownItem label="決済手数料" value={data.breakdown.paymentFee} />
                <BreakdownItem label="出品者への支払" value={data.breakdown.sellerNet} />
              </div>
            </div>

            {data.trends.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4">売上推移</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      angle={period === 'year' ? 0 : -45}
                      textAnchor={period === 'year' ? 'middle' : 'end'}
                      height={period === 'year' ? 60 : 80}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}K`}
                    />
                    <Tooltip 
                      formatter={(value: number) => `¥${value.toLocaleString()}`}
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      name="売上"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {data.sellerSales.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4">トップ10出品者</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.sellerSales.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="display_name" 
                      tick={{ fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      interval={0}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}K`}
                    />
                    <Tooltip 
                      formatter={(value: number) => `¥${value.toLocaleString()}`}
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                    <Legend />
                    <Bar dataKey="total_revenue" fill="#3B82F6" name="売上" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 mb-2 md:mb-0">出品者別売上ランキング</h2>
                <button
                  onClick={() => exportToCSV('sellers')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
                  disabled={!data || data.sellerSales.length === 0}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  CSV出力
                </button>
              </div>
              {data.sellerSales.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ランク</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">出品者名</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">売上</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">注文数</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.sellerSales.slice(0, 20).map((seller) => (
                        <tr key={seller.user_id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800">{seller.rank}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{seller.display_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">¥{seller.total_revenue.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{seller.order_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">データがありません</p>
              )}
            </div>

            {data.promptSales.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4">トップ10プロンプト</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.promptSales.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="title" 
                      tick={{ fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={120}
                      interval={0}
                      tickFormatter={(value) => value.length > 15 ? value.substring(0, 15) + '...' : value}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}K`}
                    />
                    <Tooltip 
                      formatter={(value: number) => `¥${value.toLocaleString()}`}
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                    <Legend />
                    <Bar dataKey="total_sales" fill="#8B5CF6" name="売上" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 mb-2 md:mb-0">プロンプト別売上ランキング（トップ20）</h2>
                <button
                  onClick={() => exportToCSV('prompts')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm flex items-center gap-2"
                  disabled={!data || data.promptSales.length === 0}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  CSV出力
                </button>
              </div>
              {data.promptSales.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ランク</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">プロンプト名</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">売上</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">注文数</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">平均価格</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.promptSales.slice(0, 20).map((prompt) => (
                        <tr key={prompt.prompt_id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-800">{prompt.rank}</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{prompt.title.length > 50 ? prompt.title.substring(0, 50) + '...' : prompt.title}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">¥{prompt.total_sales.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{prompt.order_count}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">¥{prompt.average_price.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">データがありません</p>
              )}
            </div>
          </>
        )}

        {!data && !loading && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">データを取得できませんでした</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, description, trend }: { title: string; value: string | number; icon: string; description: string; trend?: number }) {
  const isPositive = trend !== undefined && trend > 0;
  const isNegative = trend !== undefined && trend < 0;
  
  // 数値をパース（¥マークやカンマを除去）
  const numericValue = typeof value === 'string' 
    ? parseInt(value.replace(/[¥,\s]/g, ''), 10) || 0
    : value;
  
  // カウントアップアニメーション
  const animatedValue = useCounterAnimation(numericValue, 1200);
  
  // フォーマット済みの値かどうかを判定
  const isFormatted = typeof value === 'string' && (value.includes('¥') || value.includes(','));
  
  // 表示用の値を決定
  const displayValue = isFormatted 
    ? (typeof value === 'string' && value.includes('¥'))
      ? `¥${animatedValue.toLocaleString()}`
      : `${animatedValue.toLocaleString()}`
    : value;
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{displayValue}</p>
          {trend !== undefined && (
            <div className="flex items-center mt-1">
              {isPositive ? (
                <span className="inline-flex items-center text-sm font-medium text-green-600">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  +{trend.toFixed(1)}%
                </span>
              ) : isNegative ? (
                <span className="inline-flex items-center text-sm font-medium text-red-600">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  {trend.toFixed(1)}%
                </span>
              ) : (
                <span className="inline-flex items-center text-sm font-medium text-gray-500">
                  ±0.0%
                </span>
              )}
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}

function BreakdownItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <p className="text-sm text-gray-600 mb-2">{label}</p>
      <p className="text-xl font-bold text-gray-900">¥{value.toLocaleString()}</p>
    </div>
  );
}
