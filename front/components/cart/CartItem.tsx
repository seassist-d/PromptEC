'use client';

import { useState } from 'react';
import { useCart } from '@/hooks/useCart';
import type { CartItem } from '@/lib/cart-service';

interface CartItemProps {
  item: CartItem;
  onRemove: (itemId: string) => void;
}

export default function CartItemComponent({ item, onRemove }: CartItemProps) {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await onRemove(item.id);
    } catch (error) {
      console.error('削除エラー:', error);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
      {/* サムネイル画像 */}
      <div className="flex-shrink-0">
        <img 
          src={item.prompts.thumbnail_url || '/placeholder.png'} 
          alt={item.prompts.title}
          className="w-16 h-16 object-cover rounded-lg"
          onError={(e) => {
            e.currentTarget.src = '/placeholder.png';
          }}
        />
      </div>
      
      {/* プロンプト情報 */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 truncate">
          {item.prompts.title}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          プロンプトID: {item.prompt_id.slice(0, 8)}...
        </p>
        <div className="flex items-center space-x-2 mt-2">
          <span className="text-lg font-semibold text-blue-600">
            ¥{item.unit_price_jpy.toLocaleString()}
          </span>
          {item.quantity > 1 && (
            <span className="text-sm text-gray-500">
              × {item.quantity}
            </span>
          )}
        </div>
      </div>
      
      {/* 削除ボタン */}
      <div className="flex-shrink-0">
        <button
          onClick={handleRemove}
          disabled={isRemoving}
          className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed p-2 rounded-lg hover:bg-red-50 transition-colors"
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
