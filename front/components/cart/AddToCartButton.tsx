'use client';

import { useState } from 'react';
import { useCart } from '@/hooks/useCart';
import toast from 'react-hot-toast';

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
        // 成功時のトースト通知
        toast.success(`カートに追加しました！`, {
          icon: '🛒',
          duration: 3000,
        });
      } else {
        // エラートースト通知
        toast.error(result.error || 'カートへの追加に失敗しました', {
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('カート追加エラー:', error);
      toast.error('カートへの追加に失敗しました', {
        duration: 4000,
      });
    } finally {
      setIsAdding(false);
    }
  };

  const isAlreadyInCart = isInCart(promptId);
  const isDisabled = isAdding || isLoading || isAlreadyInCart;

  const defaultClassName = `
    relative overflow-hidden w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold 
    hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl
    active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
    ${className}
  `.trim();

  if (isAlreadyInCart) {
    return (
      <button
        disabled
        className={defaultClassName}
        aria-label="カートに追加済み"
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
      aria-label="カートに追加"
      aria-busy={isAdding}
    >
      {/* グラデーションオーバーレイ */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 transform -skew-x-12"></div>
      
      {isAdding ? (
        <span className="flex items-center justify-center relative z-10">
          <svg className="w-5 h-5 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          追加中...
        </span>
      ) : (
        children || (
          <span className="flex items-center justify-center relative z-10">
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
