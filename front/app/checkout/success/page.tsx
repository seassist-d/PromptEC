'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    // 注文情報を取得
    if (orderId) {
      fetch('/api/orders')
        .then(res => res.json())
        .then(data => {
          const order = data.orders?.find((o: any) => o.id === orderId);
          if (order) {
            setOrderNumber(order.order_number);
          }
        })
        .catch(err => console.error('注文情報取得エラー:', err));
    }
  }, [orderId]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="max-w-2xl w-full mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">購入完了</h1>
          <p className="text-gray-600 mb-8">
            ご購入ありがとうございました。注文が正常に処理されました。
          </p>

          {(orderNumber || orderId) && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600">注文番号</p>
              <p className="font-mono text-lg font-semibold">{orderNumber || orderId}</p>
            </div>
          )}

          <div className="space-y-3">
            <Link
              href="/profile"
              className="block w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              購入履歴を見る
            </Link>

            <Link
              href="/search"
              className="block w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              他のプロンプトを探す
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

