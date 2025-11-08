'use client';

import { useEffect } from 'react';
import Header from '@/components/layout/SimpleHeader';
import Footer from '@/components/layout/Footer';
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
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-2xl">
        {/* ヘッダー */}
        <div className="mb-6 sm:mb-8">
          {/* 買い物を続けるボタン */}
          <div className="mb-4">
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg 
                className="w-5 h-5 mr-2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              買い物を続ける
            </Link>
          </div>
          
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              カート
              {itemCount > 0 && (
                <span className="ml-2 text-lg font-normal text-gray-600">
                  ({itemCount}件)
                </span>
              )}
            </h1>
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
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* カートアイテム一覧 */}
          <div className="mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">購入する商品</h2>
            <CartList />
          </div>
          
          {/* 注文概要 */}
          <div>
            <CartSummary />
          </div>
        </div>

        {/* フッター情報 */}
        <div className="mt-8 sm:mt-12 bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">購入について</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
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
        </div>
      </main>
      <Footer />
    </div>
  );
}
