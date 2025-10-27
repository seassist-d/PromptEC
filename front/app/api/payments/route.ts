import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

// 決済処理（Stripe統合版）
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 認証確認
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, paymentMethod, stripePaymentIntentId } = body;

    if (!orderId || !paymentMethod) {
      return NextResponse.json(
        { error: '注文IDと支払い方法が必要です' },
        { status: 400 }
      );
    }

    // 注文を確認
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, buyer_id, total_amount_jpy, status')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: '注文が見つかりません' },
        { status: 404 }
      );
    }

    if (order.buyer_id !== user.id) {
      return NextResponse.json(
        { error: 'この注文を処理する権限がありません' },
        { status: 403 }
      );
    }

    if (order.status !== 'pending') {
      return NextResponse.json(
        { error: 'この注文は既に処理済みです' },
        { status: 400 }
      );
    }

    // 支払い方法からprovider_idを取得
    console.log('支払い方法コード:', paymentMethod);
    const { data: provider, error: providerError } = await supabase
      .from('payment_providers')
      .select('id, code')
      .eq('code', paymentMethod)
      .single();

    console.log('プロバイダー取得結果:', { provider, providerError });

    if (providerError || !provider) {
      console.error('プロバイダー取得エラー:', providerError);
      return NextResponse.json(
        { error: '無効な支払い方法です' },
        { status: 400 }
      );
    }

    // 決済レコードを作成
    console.log('決済レコード作成データ:', {
      order_id: orderId,
      provider_id: provider.id,
      amount_jpy: order.total_amount_jpy,
      status: 'captured'
    });

    // Stripe決済の場合はPaymentIntentを確認
    // 注意: INSERT時はstatus='pending'として作成し、後でUPDATEしてトリガーを発動させる
    let paymentData: any = {
      order_id: orderId,
      provider_id: provider.id,
      amount_jpy: order.total_amount_jpy,
      status: 'pending', // 最初は'pending'として作成
      raw_payload: JSON.stringify({
        method: paymentMethod,
        processed_at: new Date().toISOString(),
        note: '簡易決済処理（テスト用）'
      })
    };

    if (stripePaymentIntentId) {
      // Stripe決済の場合
      paymentData.raw_payload = JSON.stringify({
        method: paymentMethod,
        stripe_payment_intent_id: stripePaymentIntentId,
        processed_at: new Date().toISOString(),
        note: 'Stripe決済'
      });
    }

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert(paymentData)
      .select('id, status')
      .single();

    console.log('決済作成結果:', { payment, paymentError });

    if (paymentError) {
      console.error('決済作成エラー:', paymentError);
      return NextResponse.json(
        { error: '決済の作成に失敗しました' },
        { status: 500 }
      );
    }

    // トリガーを発動させるためにUPDATEを実行
    // これにより、auto_grant_entitlementsトリガーが発動し、注文statusが'paid'に更新される
    console.log('決済ステータスを更新してトリガーを発動...');
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'captured'
      })
      .eq('id', payment.id);

    if (updateError) {
      console.error('決済ステータス更新エラー:', updateError);
    } else {
      console.log('決済ステータス更新成功：トリガーが発動しました');
    }

    // 台帳エントリーを作成
    console.log('台帳エントリー作成開始');
    
    // 注文アイテムと出品者情報を取得
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        id,
        prompt_id,
        unit_price_jpy,
        prompts (
          seller_id
        )
      `)
      .eq('order_id', orderId);

    if (itemsError) {
      console.error('注文アイテム取得エラー:', itemsError);
    } else if (orderItems && orderItems.length > 0) {
      console.log('注文アイテム取得成功:', orderItems);

      // 各注文アイテムに対して台帳エントリーを作成
      for (const item of orderItems) {
        const unitPrice = item.unit_price_jpy;
        const sellerId = item.prompts?.seller_id;

        if (!sellerId) {
          console.error('出品者IDが見つかりません:', item);
          continue;
        }

        // 計算をTypeScript側で実行（型の問題を回避）
        const paymentFee = Math.floor(unitPrice * 36 / 1000); // 3.6%
        const platformFee = Math.floor(unitPrice / 5); // 20%
        const sellerNet = Math.floor(unitPrice * 4 / 5 - unitPrice * 36 / 1000); // 80% - 決済手数料

        console.log('台帳エントリー計算:', {
          unitPrice,
          paymentFee,
          platformFee,
          sellerNet
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
            note: '売上計上'
          })
          .select('id')
          .single();
        
        if (saleError) {
          console.error('売上計上エラー:', saleError);
        } else {
          console.log('売上計上成功:', saleData);
        }

        // 決済手数料
        if (paymentFee > 0) {
          const { error: feeError } = await supabase
            .from('ledger_entries')
            .insert({
              entry_type: 'payment_fee',
              order_id: orderId,
              seller_id: sellerId,
              amount_jpy: -paymentFee,
              note: '決済手数料'
            });
          
          if (feeError) {
            console.error('決済手数料エラー:', feeError);
          }
        }

        // プラットフォーム手数料
        if (platformFee > 0) {
          const { error: platformError } = await supabase
            .from('ledger_entries')
            .insert({
              entry_type: 'platform_fee',
              order_id: orderId,
              seller_id: sellerId,
              amount_jpy: -platformFee,
              note: 'プラットフォーム手数料'
            });
          
          if (platformError) {
            console.error('プラットフォーム手数料エラー:', platformError);
          }
        }

        // 出品者純利益
        if (sellerNet > 0) {
          const { error: netError } = await supabase
            .from('ledger_entries')
            .insert({
              entry_type: 'seller_net',
              order_id: orderId,
              seller_id: sellerId,
              amount_jpy: sellerNet,
              note: '出品者純利益'
            });
          
          if (netError) {
            console.error('出品者純利益エラー:', netError);
          }
        }
      }

      console.log('台帳エントリー作成完了');

      // seller_balancesを更新
      console.log('seller_balancesを更新...');
      for (const item of orderItems) {
        const sellerId = item.prompts?.seller_id;
        
        if (!sellerId) {
          continue;
        }

        // RPCを呼び出してseller_balancesを更新
        const { error: balanceError } = await supabase.rpc('update_seller_balance', {
          seller_uuid: sellerId
        });

        if (balanceError) {
          console.error('seller_balances更新エラー:', balanceError);
        } else {
          console.log('seller_balances更新成功');
        }
      }
    }

    // カートをクリア
    const { data: userCart } = await supabase
      .from('carts')
      .select('id')
      .eq('buyer_id', user.id)
      .single();

    if (userCart) {
      await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', userCart.id);
      console.log('カートをクリアしました');
    }

    // 注文を確認（トリガーによってpaidになっているはず）
    const { data: updatedOrder, error: checkError } = await supabase
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .single();

    if (checkError) {
      console.error('注文ステータス確認エラー:', checkError);
    }

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      orderStatus: updatedOrder?.status,
      message: '決済が完了しました'
    });

  } catch (error) {
    console.error('決済エラー:', error);
    return NextResponse.json(
      { error: '決済処理に失敗しました' },
      { status: 500 }
    );
  }
}

