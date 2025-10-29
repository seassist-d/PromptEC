import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
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
export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // 注文サービスを使用して注文履歴を取得
    const orderService = new OrderService(supabase);
    const orders = await orderService.getOrders(user.id);

    return NextResponse.json({ orders });

  } catch (error) {
    console.error('注文取得エラー:', error);
    return NextResponse.json(
      { error: '注文の取得に失敗しました' },
      { status: 500 }
    );
  }
}