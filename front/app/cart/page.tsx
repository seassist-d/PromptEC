'use client';

import { useEffect } from 'react';
import { useCart } from '@/hooks/useCart';
import CartList from '@/components/cart/CartList';
import CartSummary from '@/components/cart/CartSummary';
import Link from 'next/link';

export default function CartPage() {
  const { itemCount, isLoading, error, refreshCart } = useCart();

  // ページ読み込み時にカートを更新
  useEffect(() => {
    refreshCart();
    // refreshCart は依存配列から除外（関数の参照が変わっても再実行しない）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                カート
                {itemCount > 0 && (
                  <span className="ml-2 text-lg font-normal text-gray-600">
                    ({itemCount}件)
                  </span>
                )}
              </h1>
              <p className="text-gray-600 mt-2">
                お気に入りのプロンプトを確認して、購入手続きに進んでください
              </p>
            </div>
            
            {/* 更新ボタン */}
            <button
              onClick={refreshCart}
              disabled={isLoading}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
              title="カートを更新"
            >
              <svg 
                className={`w-5 h-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              更新
            </button>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* メインコンテンツ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* カートアイテム一覧 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6">
                <CartList />
              </div>
            </div>
          </div>
          
          {/* 注文概要 */}
          <div className="lg:col-span-1">
            <CartSummary />
          </div>
        </div>

        {/* フッター情報 */}
        <div className="mt-12 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">購入について</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">安全な決済</h3>
              <p className="text-sm text-gray-600">
                クレジットカード、PayPal、PayPayなど、安全な決済方法をご利用いただけます
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">即座にダウンロード</h3>
              <p className="text-sm text-gray-600">
                購入完了後、すぐにプロンプトをダウンロードしてご利用いただけます
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">無制限アクセス</h3>
              <p className="text-sm text-gray-600">
                購入したプロンプトは無制限にダウンロード・ご利用いただけます
              </p>
            </div>
          </div>
        </div>

        {/* おすすめプロンプト */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">おすすめプロンプト</h2>
            <Link 
              href="/search"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              すべて見る →
            </Link>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">おすすめプロンプトの表示機能は今後実装予定です</p>
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
          </div>
        </div>
      </div>
    </div>
  );
}
