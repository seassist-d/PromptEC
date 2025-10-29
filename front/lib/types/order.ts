/**
 * 注文関連の型定義
 * フェーズ6: 型定義を集約
 */

/**
 * 注文作成時のカートアイテム（最小限の情報のみ）
 * 
 * 注意: カート表示用のCartItemは @/lib/cart-service で定義されています。
 * こちらは注文処理用の最小限のデータ構造です。
 */
export interface OrderCartItem {
  id: string;
  prompt_id: string;
  unit_price_jpy: number;
  quantity: number;
}

/**
 * 注文アイテム（出品者情報を含む）
 */
export interface OrderItemWithSeller {
  id: string;
  prompt_id: string;
  unit_price_jpy: number;
  quantity?: number;
  prompts?: {
    seller_id: string;
  } | null;
}

/**
 * 注文情報
 */
export interface Order {
  id: string;
  buyer_id: string;
  order_number: string;
  total_amount_jpy: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';
  created_at: string;
  updated_at?: string | null;
}

/**
 * 注文作成リクエスト
 */
export interface CreateOrderRequest {
  paymentMethod: string;
}

/**
 * 注文作成レスポンス
 */
export interface CreateOrderResponse {
  success: boolean;
  orderId: string;
  orderNumber: string;
  message: string;
}
