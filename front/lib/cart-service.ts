import { createClient } from '@/lib/supabase-browser';

export interface CartItem {
  id: string;
  prompt_id: string;
  unit_price_jpy: number;
  quantity: number;
  created_at: string;
  prompts: {
    id: string;
    slug: string;
    title: string;
    thumbnail_url?: string;
    price_jpy: number;
  };
}

export interface Cart {
  id: string;
  buyer_id?: string;
  temp_key?: string;
  created_at: string;
  updated_at?: string;
  cart_items: CartItem[];
}

export class CartService {
  private supabase = createClient();

  // カート作成（未ログイン時はtemp_key使用）
  async createCart(userId?: string, tempKey?: string): Promise<Cart> {
    const cartData: any = {};
    
    if (userId) {
      cartData.buyer_id = userId;
    } else if (tempKey) {
      cartData.temp_key = tempKey;
    } else {
      throw new Error('ユーザーIDまたは一時キーが必要です');
    }

    const { data, error } = await this.supabase
      .from('carts')
      .insert(cartData)
      .select(`
        id,
        buyer_id,
        temp_key,
        created_at,
        updated_at,
        cart_items (
          id,
          prompt_id,
          unit_price_jpy,
          quantity,
          created_at,
          prompts (
            id,
            title,
            thumbnail_url,
            price_jpy
          )
        )
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // カート取得
  async getCart(userId?: string, tempKey?: string): Promise<Cart | null> {
    let query = this.supabase
      .from('carts')
      .select(`
        id,
        buyer_id,
        temp_key,
        created_at,
        updated_at,
        cart_items (
          id,
          prompt_id,
          unit_price_jpy,
          quantity,
          created_at,
          prompts (
            id,
            title,
            thumbnail_url,
            price_jpy
          )
        )
      `);

    if (userId) {
      query = query.eq('buyer_id', userId);
    } else if (tempKey) {
      query = query.eq('temp_key', tempKey);
    } else {
      throw new Error('ユーザーIDまたは一時キーが必要です');
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw error;
    }

    return data;
  }

  // アイテム追加
  async addItem(cartId: string, promptId: string, price: number, quantity: number = 1): Promise<CartItem> {
    // 既にカートに同じプロンプトがあるかチェック
    const { data: existingItem, error: checkError } = await this.supabase
      .from('cart_items')
      .select('id')
      .eq('cart_id', cartId)
      .eq('prompt_id', promptId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingItem) {
      throw new Error('このプロンプトは既にカートに追加されています');
    }

    const { data, error } = await this.supabase
      .from('cart_items')
      .insert({
        cart_id: cartId,
        prompt_id: promptId,
        unit_price_jpy: price,
        quantity: quantity
      })
      .select(`
        id,
        prompt_id,
        unit_price_jpy,
        quantity,
        created_at,
        prompts (
          id,
          title,
          thumbnail_url,
          price_jpy
        )
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // アイテム削除
  async removeItem(cartId: string, itemId: string): Promise<void> {
    const { error } = await this.supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId)
      .eq('cart_id', cartId);

    if (error) throw error;
  }

  // カートクリア
  async clearCart(cartId: string): Promise<void> {
    const { error } = await this.supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cartId);

    if (error) throw error;
  }

  // 一時キー生成
  generateTempKey(): string {
    return crypto.randomUUID();
  }

  // 一時キーをクッキーに保存
  setTempKeyCookie(tempKey: string): void {
    document.cookie = `cart_temp_key=${tempKey}; max-age=${60 * 60 * 24 * 7}; path=/; secure; samesite=lax`;
  }

  // 一時キーをクッキーから取得
  getTempKeyCookie(): string | null {
    const cookies = document.cookie.split(';');
    const cartCookie = cookies.find(cookie => 
      cookie.trim().startsWith('cart_temp_key=')
    );
    
    if (cartCookie) {
      return cartCookie.split('=')[1];
    }
    
    return null;
  }

  // 一時キーをクッキーから削除
  removeTempKeyCookie(): void {
    document.cookie = 'cart_temp_key=; max-age=0; path=/';
  }

  // カートの合計金額計算
  calculateTotal(items: CartItem[]): number {
    return items.reduce((total, item) => total + (item.unit_price_jpy * item.quantity), 0);
  }

  // カートのアイテム数計算
  calculateItemCount(items: CartItem[]): number {
    return items.reduce((count, item) => count + item.quantity, 0);
  }
}

// シングルトンインスタンス
export const cartService = new CartService();
