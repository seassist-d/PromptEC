import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

// カート取得
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 認証状態を確認
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      return NextResponse.json({ error: '認証エラー' }, { status: 401 });
    }

    let cart;
    
    if (user) {
      // ログインユーザーのカートを取得
      const { data, error } = await supabase
        .from('carts')
        .select(`
          id,
          buyer_id,
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
        .eq('buyer_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }
      
      cart = data;
    } else {
      // 未ログインユーザーの一時カートを取得
      const cookieStore = cookies();
      const tempKey = cookieStore.get('cart_temp_key')?.value;
      
      if (!tempKey) {
        return NextResponse.json({ cart: null, items: [] });
      }

      const { data, error } = await supabase
        .from('carts')
        .select(`
          id,
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
        .eq('temp_key', tempKey)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      cart = data;
    }

    return NextResponse.json({ 
      cart: cart || null, 
      items: cart?.cart_items || [] 
    });

  } catch (error) {
    console.error('カート取得エラー:', error);
    return NextResponse.json(
      { error: 'カートの取得に失敗しました' }, 
      { status: 500 }
    );
  }
}

// カートにアイテム追加
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { promptId, quantity = 1 } = body;

    if (!promptId) {
      return NextResponse.json(
        { error: 'プロンプトIDが必要です' }, 
        { status: 400 }
      );
    }

    // 認証状態を確認
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      return NextResponse.json({ error: '認証エラー' }, { status: 401 });
    }

    // プロンプト情報を取得
    const { data: prompt, error: promptError } = await supabase
      .from('prompts')
      .select('id, title, price_jpy, status')
      .eq('id', promptId)
      .eq('status', 'published')
      .single();

    if (promptError || !prompt) {
      return NextResponse.json(
        { error: 'プロンプトが見つかりません' }, 
        { status: 404 }
      );
    }

    let cartId;
    
    if (user) {
      // ログインユーザーのカートを取得または作成
      let { data: cart, error: cartError } = await supabase
        .from('carts')
        .select('id')
        .eq('buyer_id', user.id)
        .single();

      if (cartError && cartError.code === 'PGRST116') {
        // カートが存在しない場合は作成
        const { data: newCart, error: createError } = await supabase
          .from('carts')
          .insert({ buyer_id: user.id })
          .select('id')
          .single();

        if (createError) throw createError;
        cart = newCart;
      } else if (cartError) {
        throw cartError;
      }

      cartId = cart.id;
    } else {
      // 未ログインユーザーの一時カートを取得または作成
      const cookieStore = cookies();
      let tempKey = cookieStore.get('cart_temp_key')?.value;
      
      if (!tempKey) {
        tempKey = crypto.randomUUID();
        cookieStore.set('cart_temp_key', tempKey, {
          maxAge: 60 * 60 * 24 * 7, // 7日間
          httpOnly: true,
          secure: true,
          sameSite: 'lax'
        });
      }

      let { data: cart, error: cartError } = await supabase
        .from('carts')
        .select('id')
        .eq('temp_key', tempKey)
        .single();

      if (cartError && cartError.code === 'PGRST116') {
        // カートが存在しない場合は作成
        const { data: newCart, error: createError } = await supabase
          .from('carts')
          .insert({ temp_key: tempKey })
          .select('id')
          .single();

        if (createError) throw createError;
        cart = newCart;
      } else if (cartError) {
        throw cartError;
      }

      cartId = cart.id;
    }

    // 既にカートに同じプロンプトがあるかチェック
    const { data: existingItem, error: checkError } = await supabase
      .from('cart_items')
      .select('id')
      .eq('cart_id', cartId)
      .eq('prompt_id', promptId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingItem) {
      return NextResponse.json(
        { error: 'このプロンプトは既にカートに追加されています' }, 
        { status: 400 }
      );
    }

    // カートアイテムを追加
    const { data: cartItem, error: itemError } = await supabase
      .from('cart_items')
      .insert({
        cart_id: cartId,
        prompt_id: promptId,
        unit_price_jpy: prompt.price_jpy,
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

    if (itemError) throw itemError;

    return NextResponse.json({ 
      success: true, 
      item: cartItem,
      message: 'カートに追加しました' 
    });

  } catch (error) {
    console.error('カート追加エラー:', error);
    return NextResponse.json(
      { error: 'カートへの追加に失敗しました' }, 
      { status: 500 }
    );
  }
}

// カートからアイテム削除
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json(
        { error: 'アイテムIDが必要です' }, 
        { status: 400 }
      );
    }

    // 認証状態を確認
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      return NextResponse.json({ error: '認証エラー' }, { status: 401 });
    }

    let cartCondition;
    
    if (user) {
      cartCondition = { buyer_id: user.id };
    } else {
      const cookieStore = cookies();
      const tempKey = cookieStore.get('cart_temp_key')?.value;
      
      if (!tempKey) {
        return NextResponse.json(
          { error: 'カートが見つかりません' }, 
          { status: 404 }
        );
      }
      
      cartCondition = { temp_key: tempKey };
    }

    // まずカートIDを取得
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .match(cartCondition)
      .single();

    if (cartError) {
      return NextResponse.json(
        { error: 'カートが見つかりません' }, 
        { status: 404 }
      );
    }

    // カートアイテムを削除
    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId)
      .eq('cart_id', cart.id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ 
      success: true, 
      message: 'カートから削除しました' 
    });

  } catch (error) {
    console.error('カート削除エラー:', error);
    return NextResponse.json(
      { error: 'カートからの削除に失敗しました' }, 
      { status: 500 }
    );
  }
}
