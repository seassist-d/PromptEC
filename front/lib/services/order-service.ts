import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { getLatestPromptVersion } from './prompt-version-service';
import type { Order, OrderCartItem } from '@/lib/types/order';

/**
 * 注文関連のサービス
 * 
 * ステップ2: 注文作成ロジックをサービスとして分離（まだ使用しない）
 */

export interface CreateOrderResult {
  orderId: string;
  orderNumber: string;
}

export class OrderService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * 注文を作成する
   * @param buyerId 購入者ID
   * @param paymentMethod 支払い方法
   * @returns 作成された注文情報
   */
  async createOrder(
    buyerId: string,
    paymentMethod: string
  ): Promise<CreateOrderResult> {
    // カートを取得
    const { data: cart, error: cartError } = await this.supabase
      .from('carts')
      .select(`
        id,
        cart_items (
          id,
          prompt_id,
          unit_price_jpy,
          quantity
        )
      `)
      .eq('buyer_id', buyerId)
      .single();

    if (cartError || !cart) {
      throw new Error('カートが見つかりません');
    }

    if (cart.cart_items.length === 0) {
      throw new Error('カートが空です');
    }

    // 合計金額を計算
    const totalAmount = cart.cart_items.reduce(
      (sum: number, item: OrderCartItem) => sum + item.unit_price_jpy,
      0
    );

    // 注文番号を生成
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 注文を作成
    const { data: order, error: orderError } = await this.supabase
      .from('orders')
      .insert({
        buyer_id: buyerId,
        order_number: orderNumber,
        total_amount_jpy: totalAmount,
        currency: 'JPY',
        status: 'pending'
      })
      .select('id')
      .single();

    if (orderError) throw orderError;

    // 注文アイテムを作成
    const orderItems = await Promise.all(
      cart.cart_items.map(async (item: OrderCartItem) => {
        // プロンプトの最新バージョンを取得（サービス関数を使用）
        const promptVersion = await getLatestPromptVersion(this.supabase, item.prompt_id);

        const insertData = {
          order_id: order.id,
          prompt_id: item.prompt_id,
          prompt_version_id: promptVersion.id,
          unit_price_jpy: item.unit_price_jpy,
          quantity: item.quantity
        };

        const { data: orderItem, error: itemError } = await this.supabase
          .from('order_items')
          .insert(insertData)
          .select('id')
          .single();

        if (itemError) {
          console.error('注文アイテム作成エラー:', itemError);
          throw itemError;
        }

        return orderItem;
      })
    );

    // アイテムの作成に失敗した場合は null が含まれている
    const validOrderItems = orderItems.filter(item => item !== null);
    if (validOrderItems.length === 0) {
      throw new Error('注文アイテムの作成に失敗しました');
    }

    return {
      orderId: order.id,
      orderNumber
    };
  }

  /**
   * 注文を取得する（注文履歴用）
   * @param buyerId 購入者ID
   * @returns 注文リスト
   */
  async getOrders(buyerId: string): Promise<Order[]> {
    const { data: orders, error } = await this.supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          prompt_id,
          prompt_version_id,
          unit_price_jpy,
          quantity,
          created_at,
          prompt_versions (
            id,
            version,
            title_snapshot,
            prompts (
              id,
              title,
              slug,
              thumbnail_url,
              short_description
            )
          )
        ),
        payments (
          id,
          status,
          provider_id,
          payment_providers (
            display_name
          )
        )
      `)
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('注文取得エラー:', error);
      throw error;
    }

    // prompt_versionsがnullの場合、個別に取得して補完
    // Service Role Keyを使用してRLSをバイパス
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    if (orders && orders.length > 0) {
      for (const order of orders) {
        if (order.order_items && order.order_items.length > 0) {
          for (const item of order.order_items) {
            if (!item.prompt_versions && item.prompt_version_id) {
              // prompt_versionsがnullの場合、個別に取得（Service Role Keyを使用）
              const { data: promptVersion, error: versionError } = await supabaseAdmin
                .from('prompt_versions')
                .select(`
                  id,
                  version,
                  title_snapshot,
                  prompts (
                    id,
                    title,
                    slug,
                    thumbnail_url,
                    short_description
                  )
                `)
                .eq('id', item.prompt_version_id)
                .single();

              if (versionError) {
                console.error('prompt_versions取得エラー:', versionError);
              } else if (promptVersion) {
                item.prompt_versions = promptVersion;
              }
            }
          }
        }
      }
    }

    return orders || [];
  }

  /**
   * 注文IDで注文を取得
   * @param orderId 注文ID
   * @param buyerId 購入者ID（権限チェック用）
   * @returns 注文情報
   */
  async getOrderById(orderId: string, buyerId: string): Promise<Order | null> {
    const { data: order, error } = await this.supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('buyer_id', buyerId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // 注文が見つからない
      }
      throw error;
    }

    return order;
  }
}