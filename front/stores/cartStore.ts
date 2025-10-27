'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cartService, type CartItem, type Cart } from '@/lib/cart-service';

interface CartState {
  // State
  cart: Cart | null;
  items: CartItem[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadCart: () => Promise<void>;
  addItem: (promptId: string, promptData: any) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  
  // Computed values
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      // Initial state
      cart: null,
      items: [],
      isLoading: false,
      error: null,

      // Load cart from server
      loadCart: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch('/api/cart', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error('カートの取得に失敗しました');
          }

          const data = await response.json();
          
          set({
            cart: data.cart,
            items: data.items || [],
            isLoading: false,
            error: null,
          });
        } catch (error) {
          console.error('カート読み込みエラー:', error);
          set({
            error: error instanceof Error ? error.message : 'カートの読み込みに失敗しました',
            isLoading: false,
          });
        }
      },

      // Add item to cart
      addItem: async (promptId: string, promptData: any) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch('/api/cart', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              promptId,
              quantity: 1,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'カートへの追加に失敗しました');
          }

          const data = await response.json();
          
          // カートを再読み込み
          await get().loadCart();
          
          set({ isLoading: false, error: null });
        } catch (error) {
          console.error('カート追加エラー:', error);
          set({
            error: error instanceof Error ? error.message : 'カートへの追加に失敗しました',
            isLoading: false,
          });
        }
      },

      // Remove item from cart
      removeItem: async (itemId: string) => {
        // 楽観的更新: 即座にローカルから削除
        const previousItems = get().items;
        set((state) => ({
          items: state.items.filter(item => item.id !== itemId),
          isLoading: true,
          error: null,
        }));
        
        try {
          const response = await fetch(`/api/cart?itemId=${itemId}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            // エラー時は元の状態に戻す
            set({
              items: previousItems,
              isLoading: false,
              error: 'カートからの削除に失敗しました',
            });
            throw new Error('カートからの削除に失敗しました');
          }

          // 成功時は楽観的更新を維持
          set({ isLoading: false, error: null });
        } catch (error) {
          console.error('カート削除エラー:', error);
          // エラー時は元の状態を保持（既にロールバック済み）
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'カートからの削除に失敗しました',
          });
        }
      },

      // Clear entire cart
      clearCart: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // 各アイテムを削除
          const { items } = get();
          for (const item of items) {
            await fetch(`/api/cart?itemId=${item.id}`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
              },
            });
          }

          // カートを再読み込み
          await get().loadCart();
          
          set({ isLoading: false, error: null });
        } catch (error) {
          console.error('カートクリアエラー:', error);
          set({
            error: error instanceof Error ? error.message : 'カートのクリアに失敗しました',
            isLoading: false,
          });
        }
      },

      // Set error state
      setError: (error: string | null) => {
        set({ error });
      },

      // Set loading state
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      // Get total price
      getTotal: () => {
        const { items } = get();
        return items.reduce((total, item) => total + (item.unit_price_jpy * item.quantity), 0);
      },

      // Get item count
      getItemCount: () => {
        const { items } = get();
        return items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage',
      // Only persist essential data
      partialize: (state) => ({
        items: state.items,
        cart: state.cart,
      }),
      // Skip hydration for server-side rendering
      skipHydration: true,
    }
  )
);
