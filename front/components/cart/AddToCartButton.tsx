'use client';

import { useState } from 'react';
import { useCart } from '@/hooks/useCart';

interface AddToCartButtonProps {
  promptId: string;
  promptData: {
    title: string;
    price_jpy: number;
    thumbnail_url?: string;
  };
  className?: string;
  children?: React.ReactNode;
}

export default function AddToCartButton({ 
  promptId, 
  promptData, 
  className = '',
  children 
}: AddToCartButtonProps) {
  const { addToCart, isInCart, isLoading } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      const result = await addToCart(promptId, promptData);
      
      if (result.success) {
        // 成功時のフィードバック（トースト通知など）
        console.log('カートに追加しました');
      } else {
        // エラーハンドリング
        console.error('カート追加エラー:', result.error);
        alert(result.error || 'カートへの追加に失敗しました');
      }
    } catch (error) {
      console.error('カート追加エラー:', error);
      alert('カートへの追加に失敗しました');
    } finally {
      setIsAdding(false);
    }
  };

  const isAlreadyInCart = isInCart(promptId);
  const isDisabled = isAdding || isLoading || isAlreadyInCart;

  const defaultClassName = `
    w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold 
    hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
    ${className}
  `.trim();

  if (isAlreadyInCart) {
    return (
      <button
        disabled
        className={defaultClassName}
      >
        <span className="flex items-center justify-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          カートに追加済み
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={handleAddToCart}
      disabled={isDisabled}
      className={defaultClassName}
    >
      {isAdding ? (
        <span className="flex items-center justify-center">
          <svg className="w-5 h-5 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          追加中...
        </span>
      ) : (
        children || (
          <span className="flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6l-1-12z" />
            </svg>
            カートに追加
          </span>
        )
      )}
    </button>
  );
}
