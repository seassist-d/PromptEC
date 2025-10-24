'use client';

import { useState } from 'react';
import { useCart } from '@/hooks/useCart';
import Link from 'next/link';

export default function CartSummary() {
  const { total, itemCount, clearCart, isLoading } = useCart();
  const [isClearing, setIsClearing] = useState(false);

  const handleClearCart = async () => {
    if (!confirm('カート内のすべてのアイテムを削除しますか？')) {
      return;
    }

    setIsClearing(true);
    try {
      const result = await clearCart();
      if (!result.success) {
        console.error('クリアエラー:', result.error);
        alert('カートのクリアに失敗しました');
      }
    } catch (error) {
      console.error('クリアエラー:', error);
      alert('カートのクリアに失敗しました');
    } finally {
      setIsClearing(false);
    }
  };

  if (itemCount === 0) {
    return null;
  }

  return (
    <div className="bg-gray-50 p-6 rounded-lg sticky top-4">
      <h2 className="text-lg font-semibold mb-4">注文概要</h2>
      
      {/* アイテム数と小計 */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm text-gray-600">
          <span>アイテム数:</span>
          <span>{itemCount}件</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>小計:</span>
          <span>¥{total.toLocaleString()}</span>
        </div>
        <div className="border-t border-gray-200 pt-2">
          <div className="flex justify-between font-semibold text-lg">
            <span>合計:</span>
            <span className="text-blue-600">¥{total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* アクションボタン */}
      <div className="space-y-3">
        <Link
          href="/checkout"
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center block disabled:opacity-50 disabled:cursor-not-allowed"
        >
          購入手続きへ
        </Link>
        
        <button
          onClick={handleClearCart}
          disabled={isClearing || isLoading}
          className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isClearing ? (
            <span className="flex items-center justify-center">
              <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              クリア中...
            </span>
          ) : (
            'カートをクリア'
          )}
        </button>
      </div>

      {/* 注意事項 */}
      <div className="mt-4 text-xs text-gray-500">
        <p>• 価格は税込みです</p>
        <p>• デジタル商品のため、返品はできません</p>
        <p>• 購入後は無制限にダウンロード可能です</p>
      </div>
    </div>
  );
}
