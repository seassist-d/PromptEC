'use client';

import type { CartItem } from '@/lib/cart-service';
import Link from 'next/link';

interface CartItemProps {
  item: CartItem;
}

export default function CartItemComponent({ item }: CartItemProps) {

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
        {item.quantity > 1 && (
          <span className="text-sm text-gray-500 mt-1 sm:mt-2 block">
            × {item.quantity}
          </span>
        )}
      </div>
      
      {/* 金額 */}
      <div className="flex-shrink-0 text-right ml-8 sm:ml-12">
        <span className="text-base sm:text-lg font-semibold text-blue-600">
          ¥{item.unit_price_jpy.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
