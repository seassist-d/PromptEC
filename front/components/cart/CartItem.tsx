'use client';

import { useState } from 'react';
import { useCart } from '@/hooks/useCart';
import type { CartItem } from '@/lib/cart-service';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface CartItemProps {
  item: CartItem;
  onRemove: (itemId: string) => void;
}

export default function CartItemComponent({ item, onRemove }: CartItemProps) {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async () => {
    const toastId = toast.loading('削除中...');
    setIsRemoving(true);
    
    try {
      await onRemove(item.id);
      toast.success(`「${item.prompts.title}」をカートから削除しました`, {
        id: toastId,
        icon: '🗑️',
        duration: 3000,
      });
    } catch (error) {
      console.error('削除エラー:', error);
      toast.error('削除に失敗しました', {
        id: toastId,
        duration: 4000,
      });
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 border border-gray-200 rounded-lg hover:shadow-lg hover:border-blue-300 transition-all duration-200 group">
      {/* サムネイル画像 */}
      <div className="flex-shrink-0">
        <img 
          src={item.prompts.thumbnail_url || '/placeholder.png'} 
          alt={item.prompts.title}
          className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-lg"
          onError={(e) => {
            e.currentTarget.src = '/placeholder.png';
          }}
        />
      </div>
      
      {/* プロンプト情報 */}
      <div className="flex-1 min-w-0">
        <Link 
          href={`/prompts/${item.prompts.slug}`}
          className="font-medium sm:font-semibold text-sm sm:text-base text-gray-900 truncate hover:text-blue-600 transition-colors block"
        >
          {item.prompts.title}
        </Link>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
          ID: {item.prompt_id.slice(0, 8)}...
        </p>
        <div className="flex items-center space-x-2 mt-1 sm:mt-2">
          <span className="text-base sm:text-lg font-semibold text-blue-600">
            ¥{item.unit_price_jpy.toLocaleString()}
          </span>
          {item.quantity > 1 && (
            <span className="text-sm text-gray-500">
              × {item.quantity}
            </span>
          )}
        </div>
      </div>
      
      {/* 削除ボタンをホバー時にのみ表示（モバイルでは常に表示） */}
      <div className="flex-shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={handleRemove}
          disabled={isRemoving}
          className="text-red-600 hover:text-red-800 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed p-1.5 sm:p-2 rounded-lg transition-colors"
          title="カートから削除"
        >
          {isRemoving ? (
            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
