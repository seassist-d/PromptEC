/**
 * 決済関連の型定義
 * フェーズ6: 型定義を集約
 */

/**
 * 決済プロバイダー
 */
export interface PaymentProvider {
  id: number;
  code: string;
  display_name: string;
  fee_percent?: number | null;
  meta?: Record<string, unknown>;
}

/**
 * 決済情報
 */
export interface Payment {
  id: string;
  order_id: string;
  provider_id: number;
  provider_txn_id?: string | null;
  amount_jpy: number;
  status: 'pending' | 'captured' | 'failed' | 'refunded';
  raw_payload?: Record<string, unknown> | null;
  created_at: string;
  updated_at?: string | null;
}

/**
 * 決済処理リクエスト
 */
export interface ProcessPaymentRequest {
  orderId: string;
  paymentMethod: string;
  stripePaymentIntentId?: string;
}

/**
 * 決済処理レスポンス
 */
export interface ProcessPaymentResponse {
  success: boolean;
  paymentId: string;
  orderStatus?: string;
  message: string;
}
