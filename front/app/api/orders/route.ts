import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

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

    // カートを取得
    const { data: cart, error: cartError } = await supabase
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
      .eq('buyer_id', user.id)
      .single();

    if (cartError || !cart) {
      return NextResponse.json(
        { error: 'カートが見つかりません' },
        { status: 404 }
      );
    }

    if (cart.cart_items.length === 0) {
      return NextResponse.json(
        { error: 'カートが空です' },
        { status: 400 }
      );
    }

    // 合計金額を計算
    const totalAmount = cart.cart_items.reduce(
      (sum: number, item: any) => sum + item.unit_price_jpy,
      0
    );

    // 注文番号を生成
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 注文を作成
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        buyer_id: user.id,
        order_number: orderNumber,
        total_amount_jpy: totalAmount,
        currency: 'JPY',
        status: 'pending'
      })
      .select('id')
      .single();

    if (orderError) throw orderError;

    // 注文アイテムを作成
    console.log('カートアイテム:', JSON.stringify(cart.cart_items, null, 2));
    console.log('注文ID:', order.id);

    const orderItems = await Promise.all(
      cart.cart_items.map(async (item: any) => {
        console.log('処理中のプロンプトID:', item.prompt_id);
        
        // プロンプトの最新バージョンを取得
        const { data: promptVersions, error: versionError } = await supabase
          .from('prompt_versions')
          .select('id, version')
          .eq('prompt_id', item.prompt_id)
          .order('version', { ascending: false })
          .limit(1);

        console.log('バージョン取得結果:', { promptVersions, versionError });

        if (versionError || !promptVersions || promptVersions.length === 0) {
          console.error('プロンプトバージョン取得エラー:', versionError);
          // バージョンが存在しない場合は、エラーを返す
          throw new Error(`プロンプトID ${item.prompt_id} のバージョンが見つかりません`);
        }

        const promptVersion = promptVersions[0];
        console.log('使用するバージョン:', promptVersion);

        const insertData = {
          order_id: order.id,
          prompt_id: item.prompt_id,
          prompt_version_id: promptVersion.id,
          unit_price_jpy: item.unit_price_jpy,
          quantity: item.quantity
        };
        console.log('注文アイテム挿入データ:', JSON.stringify(insertData, null, 2));

        const { data: orderItem, error: itemError } = await supabase
          .from('order_items')
          .insert(insertData)
          .select('id')
          .single();

        if (itemError) {
          console.error('注文アイテム作成エラー:', itemError);
          throw itemError;
        }

        console.log('注文アイテム作成成功:', orderItem);
        return orderItem;
      })
    );

    // アイテムの作成に失敗した場合は null が含まれている
    const validOrderItems = orderItems.filter(item => item !== null);
    if (validOrderItems.length === 0) {
      throw new Error('注文アイテムの作成に失敗しました');
    }

    // カートをクリア
    await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cart.id);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber,
      message: '注文が作成されました'
    });

  } catch (error) {
    console.error('注文作成エラー:', error);
    return NextResponse.json(
      { error: '注文の作成に失敗しました' },
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

    // 注文と注文アイテム、プロンプト情報を取得
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          prompt_id,
          unit_price_jpy,
          quantity,
          created_at,
          prompts (
            id,
            title,
            slug,
            thumbnail_url,
            short_description
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
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ orders: orders || [] });

  } catch (error) {
    console.error('注文取得エラー:', error);
    return NextResponse.json(
      { error: '注文の取得に失敗しました' },
      { status: 500 }
    );
  }
}

