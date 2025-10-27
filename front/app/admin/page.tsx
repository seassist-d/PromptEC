'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import Link from 'next/link';
import toast from 'react-hot-toast';
import DashboardCharts from '@/components/admin/DashboardCharts';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';

interface DashboardStats {
  total_users: number;
  total_prompts: number;
  total_orders: number;
  total_revenue: number;
  pending_reviews: number;
  banned_users: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  total_amount_jpy: number;
  created_at: string;
  status: string;
}

interface RecentUser {
  user_id: string;
  display_name: string;
  created_at: string;
  role: string;
}

interface ChartStats {
  trends: {
    users: Array<{ date: string; count: number }>;
    revenue: Array<{ date: string; amount: number }>;
  };
  comparisons: {
    usersWeekOverWeek: number;
    revenueWeekOverWeek: number;
  };
  rankings: {
    topPrompts: Array<{ id: string; title: string; sales: number }>;
    topSellers: Array<{ id: string; name: string; revenue: number }>;
  };
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [chartStats, setChartStats] = useState<ChartStats | null>(null);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [newUserCount, setNewUserCount] = useState(0);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(30); // デフォルト30秒
  const [isRefreshing, setIsRefreshing] = useState(false);

  // データリロード関数
  const loadDashboardData = useCallback(async (isRefreshingCall = false) => {
    try {
      if (isRefreshingCall) {
        setIsRefreshing(true);
      }
      
      // 初回ロード時のみloadingをtrueに
      if (!stats) setLoading(true);

      // ダッシュボードデータを取得
      const [dashboardResponse, statsResponse] = await Promise.all([
        fetch('/api/admin/dashboard'),
        fetch('/api/admin/dashboard/stats')
      ]);
      
      if (!dashboardResponse.ok) {
        throw new Error('ダッシュボードデータの取得に失敗しました');
      }
      
      if (!statsResponse.ok) {
        console.warn('Stats API failed, continuing without stats');
      }
      
      const dashboardData = await dashboardResponse.json();
      const statsData = statsResponse.ok ? await statsResponse.json() : null;

      if (dashboardData.error) {
        throw new Error(dashboardData.error);
      }

      if (statsData?.error) {
        console.error('Stats error:', statsData.error);
      }

      setStats(dashboardData.stats);
      setRecentOrders(dashboardData.recentOrders || []);
      setRecentUsers(dashboardData.recentUsers || []);
      
      if (statsData) {
        setChartStats(statsData);
      }

    } catch (error: any) {
      console.error('ダッシュボード読み込みエラー:', error);
      // 初回読み込み失敗時のみエラートーストを表示
      if (!stats) {
        toast.error(`読み込みエラー: ${error.message}`);
      }
    } finally {
      if (isRefreshingCall) {
        setIsRefreshing(false);
      }
      setLoading(false);
    }
  }, [stats]);

  // リフレッシュ用ラッパー（useCallbackの依存配列を空にして無限ループを防ぐ）
  const refreshDashboard = useCallback(() => {
    loadDashboardData(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 初回ロード時のみ認証チェックを実行
  useEffect(() => {
    const checkAuthAndLoad = async () => {
      try {
        setLoading(true);

        // ユーザー情報を取得
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth/login');
          return;
        }

        // 管理者権限確認
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (profile?.role !== 'admin') {
          router.push('/');
          return;
        }

        // 認証確認後にデータをロード（リフレッシュフラグなし）
        await loadDashboardData();
      } catch (error: any) {
        console.error('認証チェックエラー:', error);
        toast.error('認証エラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 自動リフレッシュ
  useAutoRefresh({
    callback: refreshDashboard,
    intervalMs: autoRefreshInterval * 1000,
    enabled: true,
  });

  // Realtime購読：注文
  useRealtimeSubscription({
    table: 'orders',
    event: 'INSERT',
    onNewRecord: (payload) => {
      console.log('New order:', payload);
      setNewOrderCount(prev => prev + 1);
      toast.success('新しい注文がありました', {
        icon: '🛒',
      });
      refreshDashboard();
    },
  });

  // Realtime購読：ユーザー
  useRealtimeSubscription({
    table: 'user_profiles',
    event: 'INSERT',
    onNewRecord: (payload) => {
      console.log('New user:', payload);
      setNewUserCount(prev => prev + 1);
      toast.success('新しいユーザーが登録されました', {
        icon: '👤',
      });
      refreshDashboard();
    },
  });

  if (loading) {
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
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              トップページに戻る
            </Link>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">管理者ダッシュボード</h1>
              <p className="mt-2 text-sm text-gray-900">サイト全体の統計と管理</p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {/* 更新間隔調整 */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-900 whitespace-nowrap">更新間隔:</label>
                <select
                  value={autoRefreshInterval}
                  onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500"
                >
                  <option value={15}>15秒</option>
                  <option value={30}>30秒</option>
                  <option value={60}>60秒</option>
                </select>
              </div>
              
              {/* 手動更新ボタン */}
              <button
                onClick={refreshDashboard}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm md:text-base"
              >
                <svg
                  className={`w-4 h-4 md:w-5 md:h-5 ${isRefreshing ? 'animate-spin' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="hidden sm:inline">{isRefreshing ? '更新中...' : '更新'}</span>
              </button>
            </div>
          </div>
          
          {/* バッジ通知 */}
          {(newOrderCount > 0 || newUserCount > 0) && (
            <div className="mt-4 flex gap-4">
              {newOrderCount > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                  <span className="text-lg">🛒</span>
                  <span className="font-medium">新しい注文が{newOrderCount}件あります</span>
                  <button
                    onClick={() => setNewOrderCount(0)}
                    className="ml-2 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </div>
              )}
              {newUserCount > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
                  <span className="text-lg">👤</span>
                  <span className="font-medium">新しいユーザーが{newUserCount}人登録されました</span>
                  <button
                    onClick={() => setNewUserCount(0)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="総ユーザー数"
            value={stats?.total_users || 0}
            icon="👥"
          />
          <StatCard
            title="公開プロンプト数"
            value={stats?.total_prompts || 0}
            icon="📝"
          />
          <StatCard
            title="総注文数"
            value={stats?.total_orders || 0}
            icon="🛒"
          />
          <StatCard
            title="総売上"
            value={`¥${(stats?.total_revenue || 0).toLocaleString()}`}
            icon="💰"
          />
          <StatCard
            title="BAN済みユーザー"
            value={stats?.banned_users || 0}
            icon="🚫"
          />
          <StatCard
            title="レビュー数"
            value={stats?.pending_reviews || 0}
            icon="⭐"
          />
        </div>

        {/* クイックアクション */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-8">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">クイックアクション</h2>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Link
              href="/admin/users"
              className="px-4 md:px-6 py-2 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center text-sm md:text-base"
            >
              ユーザー管理
            </Link>
            <Link
              href="/admin/prompts"
              className="px-4 md:px-6 py-2 md:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-center text-sm md:text-base"
            >
              プロンプト管理
            </Link>
            <Link
              href="/admin/reports"
              className="px-4 md:px-6 py-2 md:py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-center text-sm md:text-base"
            >
              売上レポート
            </Link>
            <Link
              href="/admin/activity"
              className="px-4 md:px-6 py-2 md:py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-center text-sm md:text-base"
            >
              アクション履歴
            </Link>
          </div>
        </div>

        {/* 統計グラフ */}
        {chartStats && (
          <div className="mb-8">
            <DashboardCharts {...chartStats} />
          </div>
        )}

        {/* 最近の注文 */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-8">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">最近の注文</h2>
          {recentOrders.length > 0 ? (
            <>
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">注文番号</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金額</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日時</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentOrders.map(order => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.order_number}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">¥{order.total_amount_jpy.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          order.status === 'paid' ? 'bg-green-100 text-green-800' :
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleString('ja-JP')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* モバイル用カード表示 */}
            <div className="md:hidden space-y-4">
              {recentOrders.map(order => (
                <div key={order.id} className="border border-gray-200 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="font-medium text-gray-900">{order.order_number}</div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      order.status === 'paid' ? 'bg-green-100 text-green-800' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">¥{order.total_amount_jpy.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">{new Date(order.created_at).toLocaleString('ja-JP')}</div>
                </div>
              ))}
            </div>
            </>
          ) : (
            <p className="text-gray-500 text-center py-8">注文がありません</p>
          )}
        </div>

        {/* 最近のユーザー */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">最近のユーザー</h2>
          {recentUsers.length > 0 ? (
            <>
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">表示名</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ロール</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">登録日</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentUsers.map(user => (
                    <tr key={user.user_id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.display_name || '未設定'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'admin' ? 'bg-red-100 text-red-800' :
                          user.role === 'seller' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleString('ja-JP')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* モバイル用カード表示 */}
            <div className="md:hidden space-y-4">
              {recentUsers.map(user => (
                <div key={user.user_id} className="border border-gray-200 rounded-lg p-4 space-y-2">
                  <div className="font-medium text-gray-900">{user.display_name || '未設定'}</div>
                  <div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'admin' ? 'bg-red-100 text-red-800' :
                      user.role === 'seller' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">{new Date(user.created_at).toLocaleString('ja-JP')}</div>
                </div>
              ))}
            </div>
            </>
          ) : (
            <p className="text-gray-500 text-center py-8">ユーザーがありません</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string | number; icon: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}

