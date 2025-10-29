import type { SupabaseClient } from '@supabase/supabase-js';
import type { OrderItemWithSeller } from '@/lib/types/order';

/**
 * 台帳エントリー関連のサービス
 * 
 * フェーズ4: 台帳エントリー作成ロジックをサービスとして分離（まだ使用しない）
 * フェーズ6: 型定義を集約型からインポート
 */

export interface FeeCalculation {
  paymentFee: number;      // 決済手数料（3.6%）
  platformFee: number;     // プラットフォーム手数料（20%）
  sellerNet: number;        // 出品者純利益（80% - 決済手数料）
}

/**
 * 手数料を計算する
 * @param unitPrice 単価（JPY）
 * @returns 手数料計算結果
 */
export function calculateFees(unitPrice: number): FeeCalculation {
  const paymentFee = Math.floor(unitPrice * 36 / 1000); // 3.6%
  const platformFee = Math.floor(unitPrice / 5); // 20%
  const sellerNet = Math.floor(unitPrice * 4 / 5 - unitPrice * 36 / 1000); // 80% - 決済手数料

  return {
    paymentFee,
    platformFee,
    sellerNet,
  };
}

/**
 * 台帳エントリーを作成する
 * @param supabase Supabaseクライアント
 * @param orderId 注文ID
 * @param orderItems 注文アイテム（出品者情報を含む）
 */
export async function createLedgerEntries(
  supabase: SupabaseClient<any>,
  orderId: string,
  orderItems: OrderItemWithSeller[]
): Promise<void> {
  console.log('台帳エントリー作成開始');

  for (const item of orderItems) {
    const unitPrice = item.unit_price_jpy;
    const sellerId = item.prompts?.seller_id;

    if (!sellerId) {
      console.error('出品者IDが見つかりません:', item);
      continue;
    }

    // 手数料を計算
    const fees = calculateFees(unitPrice);

    console.log('台帳エントリー計算:', {
      unitPrice,
      paymentFee: fees.paymentFee,
      platformFee: fees.platformFee,
      sellerNet: fees.sellerNet,
    });

    // 売上計上
    const { data: saleData, error: saleError } = await supabase
      .from('ledger_entries')
      .insert({
        entry_type: 'sale_gross',
        order_id: orderId,
        order_item_id: item.id,
        seller_id: sellerId,
        amount_jpy: unitPrice,
        note: '売上計上',
      })
      .select('id')
      .single();

    if (saleError) {
      console.error('売上計上エラー:', saleError);
    } else {
      console.log('売上計上成功:', saleData);
    }

    // 決済手数料
    if (fees.paymentFee > 0) {
      const { error: feeError } = await supabase
        .from('ledger_entries')
        .insert({
          entry_type: 'payment_fee',
          order_id: orderId,
          seller_id: sellerId,
          amount_jpy: -fees.paymentFee,
          note: '決済手数料',
        });

      if (feeError) {
        console.error('決済手数料エラー:', feeError);
      }
    }

    // プラットフォーム手数料
    if (fees.platformFee > 0) {
      const { error: platformError } = await supabase
        .from('ledger_entries')
        .insert({
          entry_type: 'platform_fee',
          order_id: orderId,
          seller_id: sellerId,
          amount_jpy: -fees.platformFee,
          note: 'プラットフォーム手数料',
        });

      if (platformError) {
        console.error('プラットフォーム手数料エラー:', platformError);
      }
    }

    // 出品者純利益
    if (fees.sellerNet > 0) {
      const { error: netError } = await supabase
        .from('ledger_entries')
        .insert({
          entry_type: 'seller_net',
          order_id: orderId,
          seller_id: sellerId,
          amount_jpy: fees.sellerNet,
          note: '出品者純利益',
        });

      if (netError) {
        console.error('出品者純利益エラー:', netError);
      }
    }
  }

  console.log('台帳エントリー作成完了');
}

/**
 * 出品者残高を更新する
 * @param supabase Supabaseクライアント
 * @param sellerIds 出品者IDの配列
 */
export async function updateSellerBalances(
  supabase: SupabaseClient<any>,
  sellerIds: string[]
): Promise<void> {
  console.log('seller_balancesを更新...');

  for (const sellerId of sellerIds) {
    if (!sellerId) {
      continue;
    }

    // RPCを呼び出してseller_balancesを更新
    const { error: balanceError } = await supabase.rpc('update_seller_balance', {
      seller_uuid: sellerId,
    });

    if (balanceError) {
      console.error('seller_balances更新エラー:', balanceError);
    } else {
      console.log('seller_balances更新成功');
    }
  }
}
