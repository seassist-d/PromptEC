import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * POST /api/reviews
 * レビューを投稿
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 認証確認
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const body = await request.json();
    const { prompt_id, rating, comment } = body;

    // バリデーション
    if (!prompt_id || !rating) {
      return NextResponse.json(
        { error: 'プロンプトIDと評価は必須です' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: '評価は1〜5の間で入力してください' },
        { status: 400 }
      );
    }

    // 購入者かどうかを確認
    console.log('購入者チェック開始: ユーザーID', user.id, 'プロンプトID', prompt_id);

    // RPC関数を使って購入履歴を確認
    const { data: purchaseInfo, error: purchaseError } = await supabase
      .rpc('check_user_purchased_prompt', {
        user_id_param: user.id,
        prompt_id_param: prompt_id
      });

    console.log('購入履歴確認結果:', JSON.stringify(purchaseInfo, null, 2));

    if (purchaseError) {
      console.error('購入履歴確認エラー（RPC関数なし）:', purchaseError);
      console.log('代替方法で購入履歴を確認します...');
      
      // 代替方法1: order_itemsから直接確認
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          id,
          orders!inner (
            buyer_id,
            status
          )
        `)
        .eq('prompt_id', prompt_id);

      console.log('注文アイテム取得結果:', JSON.stringify(orderItems, null, 2));
      console.log('注文アイテム取得エラー:', itemsError);
      console.log('取得された注文アイテム数:', orderItems?.length || 0);

      if (itemsError) {
        console.error('注文アイテム取得エラー:', itemsError);
      }

      if (!orderItems || orderItems.length === 0) {
        console.log('購入履歴なし：レビュー投稿不可（注文アイテムなし）');
        return NextResponse.json(
          { error: 'このプロンプトを購入していません' },
          { status: 403 }
        );
      }

      // ユーザーが購入したかチェック
      console.log('チェック開始: ユーザーID', user.id);
      let hasPurchased = false;
      
      for (const item of orderItems) {
        console.log('注文アイテム:', JSON.stringify(item, null, 2));
        const order = item.orders;
        console.log('注文情報:', JSON.stringify(order, null, 2));
        
        if (order) {
          console.log('注文のbuyer_id:', order.buyer_id, '現在のユーザーID:', user.id);
          console.log('注文のstatus:', order.status);
          
          if (order.buyer_id === user.id && (order.status === 'paid' || order.status === 'pending')) {
            console.log('★購入者確認成功！(status:', order.status, ')');
            hasPurchased = true;
            break;
          }
        }
      }

      console.log('購入チェック結果:', hasPurchased);

      if (!hasPurchased) {
        console.log('購入履歴なし：レビュー投稿不可（このユーザーの購入履歴なし）');
        return NextResponse.json(
          { error: 'このプロンプトを購入していません' },
          { status: 403 }
        );
      }

      console.log('購入確認完了（代替方法）');
    } else if (!purchaseInfo || !purchaseInfo.purchased) {
      console.log('購入履歴なし：レビュー投稿不可');
      return NextResponse.json(
        { error: 'このプロンプトを購入していません' },
        { status: 403 }
      );
    }

    console.log('購入者確認完了：レビュー投稿可能');

    // 既にレビューが存在するか確認
    const { data: existingReview, error: checkError } = await supabase
      .from('reviews')
      .select('id')
      .eq('prompt_id', prompt_id)
      .eq('buyer_id', user.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116は「not found」なので無視、それ以外はエラー
      console.error('レビュー存在確認エラー:', checkError);
    }

    let review;
    if (existingReview) {
      // 既存レビューを更新
      const { data: updatedReview, error: updateError } = await supabase
        .from('reviews')
        .update({
          rating,
          comment: comment || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingReview.id)
        .select()
        .single();

      if (updateError) {
        console.error('レビュー更新エラー:', updateError);
        return NextResponse.json(
          { error: 'レビューの更新に失敗しました' },
          { status: 500 }
        );
      }

      review = updatedReview;
    } else {
      // 新規レビューを作成
      const { data: newReview, error: insertError } = await supabase
        .from('reviews')
        .insert({
          prompt_id,
          buyer_id: user.id,
          rating,
          comment: comment || null,
          status: 'visible'
        })
        .select()
        .single();

      if (insertError) {
        console.error('レビュー投稿エラー:', insertError);
        return NextResponse.json(
          { error: 'レビューの投稿に失敗しました' },
          { status: 500 }
        );
      }

      review = newReview;
    }

    // プロンプトの平均評価を更新
    const { data: ratingStats } = await supabase
      .from('reviews')
      .select('rating')
      .eq('prompt_id', prompt_id)
      .eq('status', 'visible');

    if (ratingStats) {
      const avgRating = ratingStats.reduce((sum, r) => sum + r.rating, 0) / ratingStats.length;
      const ratingsCount = ratingStats.length;

      await supabase
        .from('prompts')
        .update({
          avg_rating: Math.round(avgRating * 100) / 100,
          ratings_count: ratingsCount
        })
        .eq('id', prompt_id);
    }

    return NextResponse.json({
      success: true,
      review,
      message: existingReview ? 'レビューを更新しました' : 'レビューを投稿しました'
    });

  } catch (error) {
    console.error('レビュー投稿エラー:', error);
    return NextResponse.json(
      { error: 'レビューの投稿に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reviews?prompt_id=xxx
 * レビュー一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const promptId = searchParams.get('prompt_id');

    if (!promptId) {
      return NextResponse.json(
        { error: 'プロンプトIDが必要です' },
        { status: 400 }
      );
    }

    // レビュー一覧を取得
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select(`
        id,
        prompt_id,
        buyer_id,
        rating,
        comment,
        created_at,
        updated_at,
        user_profiles!buyer_id(
          display_name,
          avatar_url
        )
      `)
      .eq('prompt_id', promptId)
      .eq('status', 'visible')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('レビュー取得エラー:', error);
      return NextResponse.json(
        { error: 'レビューの取得に失敗しました' },
        { status: 500 }
      );
    }

    // レスポンス形式を整形
    const formattedReviews = (reviews || []).map((review: any) => ({
      id: review.id,
      prompt_id: review.prompt_id,
      user_id: review.buyer_id,
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at,
      updated_at: review.updated_at,
      user_name: review.user_profiles?.display_name || '不明なユーザー',
      user_avatar: review.user_profiles?.avatar_url
    }));

    return NextResponse.json({
      reviews: formattedReviews,
      count: formattedReviews.length
    });

  } catch (error) {
    console.error('レビュー取得エラー:', error);
    return NextResponse.json(
      { error: 'レビューの取得に失敗しました' },
      { status: 500 }
    );
  }
}

