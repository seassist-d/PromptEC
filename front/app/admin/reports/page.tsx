'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import Link from 'next/link';
import toast from 'react-hot-toast';

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

  useEffect(() => {
    checkAdminAndLoadData();
  }, [period]);

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
const response = await fetch(`/api/admin/reports/sales?period=${period}`);
      
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
            </div>
          </div>
        </div>

        {data && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard title="総売上" value={`¥${data.summary.totalRevenue.toLocaleString()}`} icon="💰" description="期間中の総売上" />
              <StatCard title="注文数" value={data.summary.totalOrders.toLocaleString()} icon="🛒" description="完了した注文数" />
              <StatCard title="平均単価" value={`¥${data.summary.averageOrderValue.toLocaleString()}`} icon="📊" description="注文あたりの平均金額" />
              <StatCard title="プラットフォーム収益" value={`¥${data.summary.platformRevenue.toLocaleString()}`} icon="💼" description="手数料収入" />
            </div>

            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">売上内訳</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4外层 gap-4">
                <BreakdownItem label="総売上" value={data.breakdown.totalSales} />
                <BreakdownItem label="プラットフォーム手数料" value={data.breakdown.platformFee} />
                <BreakdownItem label="決済手数料" value={data.breakdown.paymentFee} />
                <BreakdownItem label="出品者への支払" value={data.breakdown.sellerNet} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">出品者別売上ランキング</h2>
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

            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">プロンプト別売上ランキング（トップ20）</h2>
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

function StatCard({ title, value, icon, description }: { title: string; value: string | number; icon: string; description: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}

function BreakdownItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-gray-200 rounded-lg名师-4">
      <p className="text-sm text-gray-600 mb-2">{label}</p>
      <p className="text-xl font-bold text-gray-900">¥{value.toLocaleString()}</p>
    </div>
  );
}
