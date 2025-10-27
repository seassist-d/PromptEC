import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

/**
 * POST /api/create-payment-intent
 * Stripe PaymentIntentを作成
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: '注文IDが必要です' }, { status: 400 });
    }

    // 注文情報を取得
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, total_amount_jpy, buyer_id, status')
      .eq('id', orderId)
      .eq('buyer_id', user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: '注文が見つかりません' }, { status: 404 });
    }

    // 注文が既に支払い済みか確認
    if (order.status === 'paid') {
      return NextResponse.json({ error: 'この注文は既に支払い済みです' }, { status: 400 });
    }

    // PaymentIntentを作成
    const paymentIntent = await stripe.paymentIntents.create({
      amount: order.total_amount_jpy * 100, // 円を最小単位に変換
      currency: 'jpy',
      metadata: {
        order_id: order.id,
        buyer_id: user.id,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return NextResponse.json({ 
      clientSecret: paymentIntent.client_secret 
    });
  } catch (error) {
    console.error('PaymentIntent作成エラー:', error);
    return NextResponse.json(
      { error: 'PaymentIntentの作成に失敗しました' },
      { status: 500 }
    );
  }
}

