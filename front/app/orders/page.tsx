'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface OrderItem {
  id: string;
  prompt_id: string;
  prompt_version_id: string;
  unit_price_jpy: number;
  quantity: number;
  prompt_versions: {
    id: string;
    version: number;
    prompts: {
      id: string;
      title: string;
      slug: string;
      thumbnail_url?: string;
      short_description?: string;
    };
  };
}

interface Payment {
  id: string;
  status: string;
  provider_id: number;
  payment_providers: {
    display_name: string;
  };
}

interface Order {
  id: string;
  order_number: string;
  total_amount_jpy: number;
  status: string;
  created_at: string;
  order_items: OrderItem[];
  payments: Payment[] | Payment;
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/orders');
        if (!response.ok) {
          throw new Error('注文履歴の取得に失敗しました');
        }

        const data = await response.json();
        console.log('注文履歴データ:', JSON.stringify(data.orders?.[0], null, 2));
        setOrders(data.orders || []);
      } catch (err) {
        console.error('注文履歴取得エラー:', err);
        setError(err instanceof Error ? err.message : 'エラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: '処理中',
      paid: '支払い完了',
      failed: '失敗',
      cancelled: 'キャンセル済み',
      refunded: '返金済み'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      refunded: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">エラーが発生しました</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">購入履歴</h1>
              <p className="text-gray-600 mt-2">過去の購入履歴を確認できます</p>
            </div>
            <Link
              href="/profile"
              className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              プロフィールに戻る
            </Link>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">購入履歴がありません</h3>
            <p className="text-gray-600 mb-6">まだ購入したプロンプトがありません</p>
            <Link
              href="/search"
              className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              プロンプトを探す
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* 注文ヘッダー */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="text-sm text-gray-600">注文番号</p>
                        <p className="font-mono text-sm font-semibold text-gray-900">{order.order_number}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">注文日</p>
                        <p className="text-sm text-gray-900">{formatDate(order.created_at)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">合計金額</p>
                      <p className="text-2xl font-bold text-blue-600">¥{order.total_amount_jpy.toLocaleString()}</p>
                      <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 注文アイテム一覧 */}
                <div className="px-6 py-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">購入商品</h3>
                  {!order.order_items || order.order_items.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      注文アイテムが見つかりません
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {order.order_items.map((item) => {
                      const prompt = item.prompt_versions?.prompts;
                      
                      // プロンプト情報がない場合の処理
                      if (!prompt) {
                        return (
                          <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                            <div className="flex items-center space-x-4 flex-1">
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900">プロンプト情報が取得できません</p>
                                <p className="text-sm text-gray-500">ID: {item.prompt_id}</p>
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-lg font-bold text-gray-900">¥{item.unit_price_jpy.toLocaleString()}</p>
                            </div>
                          </div>
                        );
                      }
                      
                      return (
                        <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                          <div className="flex items-center space-x-4 flex-1">
                            {prompt.thumbnail_url && (
                              <img
                                src={prompt.thumbnail_url}
                                alt={prompt.title}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                            )}
                            <div className="flex-1">
                              <Link
                                href={`/prompts/${prompt.slug}`}
                                className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                              >
                                {prompt.title || 'プロンプト'}
                              </Link>
                              {prompt.short_description && (
                                <p className="text-sm text-gray-600 mt-1">{prompt.short_description}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-lg font-bold text-gray-900">¥{item.unit_price_jpy.toLocaleString()}</p>
                            {order.status === 'paid' && (
                              <Link
                                href={`/api/download/${order.id}/${item.id}`}
                                className="mt-2 inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                ダウンロード
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  )}
                </div>

                {/* 決済情報 */}
                {order.payments && (
                  <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <p className="text-xs text-gray-600">
                      決済方法: {(() => {
                        const payment = Array.isArray(order.payments) ? order.payments[0] : order.payments;
                        return payment?.payment_providers?.display_name || '不明';
                      })()}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

