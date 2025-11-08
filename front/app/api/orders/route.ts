import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { OrderService } from '@/lib/services/order-service';

// ステップ2: OrderServiceを使用して注文作成ロジックを分離

// 注文作成
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 認証確認
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const body = await request.json();
    const { paymentMethod } = body;

    if (!paymentMethod) {
      return NextResponse.json(
        { error: '支払い方法を選択してください' },
        { status: 400 }
      );
    }

    // 注文サービスを使用して注文を作成
    const orderService = new OrderService(supabase);
    const result = await orderService.createOrder(user.id, paymentMethod);

    return NextResponse.json({
      success: true,
      orderId: result.orderId,
      orderNumber: result.orderNumber,
      message: '注文が作成されました'
    });

  } catch (error) {
    console.error('注文作成エラー:', error);
    const errorMessage = error instanceof Error ? error.message : '注文の作成に失敗しました';
    const errorDetails = error instanceof Error ? error.stack : String(error);
    console.error('エラー詳細:', errorDetails);
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { status: 500 }
    );
  }
}

// 注文履歴取得
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // クエリパラメータからorderIdを取得
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    // 注文サービスを使用して注文履歴を取得
    const orderService = new OrderService(supabase);
    
    if (orderId) {
      // 特定の注文のみを取得（効率化のため直接クエリ）
      const { data: order, error: orderError } = await supabase
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
        .eq('id', orderId)
        .eq('buyer_id', user.id)
        .single();

      if (orderError || !order) {
        return NextResponse.json({ orders: [] });
      }

      // prompt_versionsがnullの場合、個別に取得して補完
      if (order.order_items && order.order_items.length > 0) {
        for (const item of order.order_items) {
          if (!item.prompt_versions && item.prompt_version_id) {
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

            const { data: promptVersion } = await supabaseAdmin
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

            if (promptVersion) {
              item.prompt_versions = promptVersion;
            }
          }
        }
      }

      return NextResponse.json({ orders: [order] });
    } else {
      // 全注文を取得
      const orders = await orderService.getOrders(user.id);
      return NextResponse.json({ orders });
    }

  } catch (error) {
    console.error('注文取得エラー:', error);
    return NextResponse.json(
      { error: '注文の取得に失敗しました' },
      { status: 500 }
    );
  }
}