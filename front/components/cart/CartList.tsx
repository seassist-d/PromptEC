'use client';

import { useState } from 'react';
import { useCart } from '@/hooks/useCart';
import CartItemComponent from './CartItem';
import { AnimatePresence, motion } from 'framer-motion';

export default function CartList() {
  const { items, removeFromCart, isLoading, error } = useCart();
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());

  const handleRemoveItem = async (itemId: string) => {
    // 楽観的UI更新: 即座にUIから削除
    setRemovingItems(prev => new Set(prev).add(itemId));
    
    try {
      const result = await removeFromCart(itemId);
      if (!result.success) {
        console.error('削除エラー:', result.error);
      }
    } catch (error) {
      console.error('削除エラー:', error);
    } finally {
      // 削除完了後は要素を完全に削除
      setRemovingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  if (isLoading && items.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
              <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg font-semibold">エラーが発生しました</p>
          <p className="text-sm text-gray-600 mt-1">{error}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          再読み込み
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <svg className="w-20 h-20 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6l-1-12z" />
        </svg>
        <h3 className="text-xl font-semibold text-gray-700 mb-3">カートが空です</h3>
        <p className="text-sm mb-4 text-gray-500">プロンプトを探してカートに追加しましょう</p>
        <a
          href="/search"
          className="inline-flex items-center bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
        >
          プロンプトを探す
        </a>
      </div>
    );
  }

  // フィルタリング: removingItemsに含まれるアイテムは表示しない（楽観的更新）
  const visibleItems = items.filter(item => !removingItems.has(item.id));

  return (
    <AnimatePresence mode="popLayout">
      <div className="space-y-3 sm:space-y-4">
        {visibleItems.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <CartItemComponent
              item={item}
              onRemove={handleRemoveItem}
            />
          </motion.div>
        ))}
        
        {isLoading && (
          <div className="text-center py-4">
            <div className="inline-flex items-center text-blue-600">
              <svg className="w-5 h-5 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              更新中...
            </div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
}
