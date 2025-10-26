'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import Link from 'next/link';

interface SellerBalance {
  available_jpy: number;
  pending_jpy: number;
}

interface SalesStats {
  total_sales: number;
  total_orders: number;
  average_order_value: number;
  total_commission: number;
  net_earnings: number;
}

interface LedgerEntry {
  id: number;
  entry_type: string;
  amount_jpy: number;
  note: string;
  created_at: string;
}

interface Prompt {
  id: string;
  title: string;
  slug: string;
  price_jpy: number;
  status: string;
  view_count: number;
  ratings_count: number;
  created_at: string;
}

export default function SellerDashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<SellerBalance | null>(null);
  const [salesStats, setSalesStats] = useState<SalesStats | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // ユーザー情報を取得
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      setUserId(user.id);

      // 出品者残高を取得
      const { data: balanceData } = await supabase
        .from('seller_balances')
        .select('available_jpy, pending_jpy')
        .eq('seller_id', user.id)
        .single();

      if (balanceData) {
        setBalance(balanceData);
      }

      // 台帳エントリーを取得（最新20件）
      const { data: ledgerData } = await supabase
        .from('ledger_entries')
        .select('id, entry_type, amount_jpy, note, created_at')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (ledgerData) {
        setLedgerEntries(ledgerData);
      }

      // 出品プロンプトを取得
      const { data: promptsData } = await supabase
        .from('prompts')
        .select('id, title, price_jpy, status, view_count, ratings_count, created_at, slug')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (promptsData) {
        setPrompts(promptsData);
      }

      // 売上統計を取得（APIから）
      const { data: statsData, error: statsError } = await supabase.rpc('get_sales_statistics', {
        seller_uuid: user.id,
        start_date: null,
        end_date: null
      });

      if (statsError) {
        console.error('売上統計取得エラー:', statsError);
      }

      if (statsData && statsData.length > 0) {
        setSalesStats(statsData[0] as SalesStats);
      }

    } catch (error) {
      console.error('ダッシュボードデータの取得に失敗しました:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(amount);
  };

  const getEntryTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      sale_gross: '売上',
      payment_fee: '決済手数料',
      platform_fee: 'プラットフォーム手数料',
      seller_net: '出品者純利益',
      payout: '出金',
      adjustment: '調整',
      refund: '返金'
    };
    return labels[type] || type;
  };

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
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">出品者ダッシュボード</h1>
          <p className="mt-2 text-sm text-gray-600">売上と残高を確認できます</p>
        </div>

        {/* 残高カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">利用可能残高</h2>
            <p className="text-3xl font-bold text-green-600">
              {balance ? formatCurrency(balance.available_jpy) : '¥0'}
            </p>
            <p className="text-sm text-gray-500 mt-2">出金可能な金額</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">保留中残高</h2>
            <p className="text-3xl font-bold text-yellow-600">
              {balance ? formatCurrency(balance.pending_jpy) : '¥0'}
            </p>
            <p className="text-sm text-gray-500 mt-2">30日間の保留期間中</p>
          </div>
        </div>

        {/* 売上統計カード */}
        {salesStats && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">売上統計</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-sm text-gray-600">総売上</p>
                <p className="text-xl font-semibold text-gray-900">{formatCurrency(salesStats.total_sales)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">注文件数</p>
                <p className="text-xl font-semibold text-gray-900">{salesStats.total_orders}件</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">平均注文額</p>
                <p className="text-xl font-semibold text-gray-900">{formatCurrency(salesStats.average_order_value)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">手数料合計</p>
                <p className="text-xl font-semibold text-gray-900">{formatCurrency(salesStats.total_commission)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">純利益</p>
                <p className="text-xl font-semibold text-green-600">{formatCurrency(salesStats.net_earnings)}</p>
              </div>
            </div>
          </div>
        )}

        {/* 台帳エントリー一覧 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">最近の台帳エントリー</h2>
          {ledgerEntries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">種別</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金額</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">備考</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日時</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ledgerEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          entry.entry_type === 'seller_net' ? 'bg-green-100 text-green-800' :
                          entry.entry_type === 'sale_gross' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {getEntryTypeLabel(entry.entry_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={entry.amount_jpy >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {entry.amount_jpy >= 0 ? '+' : ''}{formatCurrency(entry.amount_jpy)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.note}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(entry.created_at).toLocaleString('ja-JP')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">台帳エントリーがありません</p>
          )}
        </div>

        {/* 出品プロンプト一覧 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">出品プロンプト</h2>
            <Link
              href="/prompts/create"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition"
            >
              新規作成
            </Link>
          </div>
          {prompts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {prompts.map((prompt) => (
                <Link
                  key={prompt.id}
                  href={`/prompts/${prompt.slug}`}
                  className="border rounded-lg p-4 hover:shadow-lg transition"
                >
                  <h3 className="font-semibold text-gray-900 mb-2">{prompt.title}</h3>
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>{formatCurrency(prompt.price_jpy)}</span>
                    <span className={`px-2 py-1 rounded ${
                      prompt.status === 'published' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {prompt.status === 'published' ? '公開中' : '下書き'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              まだ出品していません
              <Link href="/prompts/create" className="text-blue-600 hover:underline ml-1">
                最初のプロンプトを作成
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
