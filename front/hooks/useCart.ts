'use client';

import { useCartStore } from '@/stores/cartStore';
import { useAuth } from '@/lib/useAuth';
import { useEffect } from 'react';

export function useCart() {
  const { user } = useAuth();
  const {
    cart,
    items,
    isLoading,
    error,
    loadCart,
    addItem,
    removeItem,
    clearCart,
    setError,
    getTotal,
    getItemCount,
  } = useCartStore();

  // 認証状態が変わったらカートを再読み込み
  useEffect(() => {
    if (user !== undefined) { // undefined = まだ認証状態を確認中
      loadCart();
    }
  }, [user, loadCart]);

  // カートにプロンプトを追加
  const addToCart = async (promptId: string, promptData: {
    title: string;
    price_jpy: number;
    thumbnail_url?: string;
  }) => {
    try {
      await addItem(promptId, promptData);
      return { success: true };
    } catch (error) {
      console.error('カート追加エラー:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'カートへの追加に失敗しました' 
      };
    }
  };

  // カートからアイテムを削除
  const removeFromCart = async (itemId: string) => {
    try {
      await removeItem(itemId);
      return { success: true };
    } catch (error) {
      console.error('カート削除エラー:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'カートからの削除に失敗しました' 
      };
    }
  };

  // カートをクリア
  const clearCartItems = async () => {
    try {
      await clearCart();
      return { success: true };
    } catch (error) {
      console.error('カートクリアエラー:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'カートのクリアに失敗しました' 
      };
    }
  };

  // エラーをクリア
  const clearError = () => {
    setError(null);
  };

  // カートの合計金額
  const total = getTotal();

  // カートのアイテム数
  const itemCount = getItemCount();

  // カートが空かどうか
  const isEmpty = itemCount === 0;

  // 特定のプロンプトがカートに含まれているかチェック
  const isInCart = (promptId: string) => {
    return items.some(item => item.prompt_id === promptId);
  };

  // カートの再読み込み
  const refreshCart = () => {
    loadCart();
  };

  return {
    // State
    cart,
    items,
    isLoading,
    error,
    isEmpty,
    
    // Computed values
    total,
    itemCount,
    
    // Actions
    addToCart,
    removeFromCart,
    clearCart: clearCartItems,
    clearError,
    refreshCart,
    isInCart,
    
    // Direct store actions (if needed)
    loadCart,
  };
}
