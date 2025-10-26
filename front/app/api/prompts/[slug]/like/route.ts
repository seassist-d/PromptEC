import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// いいねの状態を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createClient();
    const { slug } = await params;

    // 認証状態を確認
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // プロンプトIDを取得
    const { data: prompt, error: promptError } = await supabase
      .from('prompts')
      .select('id')
      .eq('slug', slug)
      .single();

    if (promptError || !prompt) {
      return NextResponse.json(
        { error: 'プロンプトが見つかりません' },
        { status: 404 }
      );
    }

    // ユーザーが既にいいねしているかチェック
    const { data: existingLike, error: likeError } = await supabase
      .from('recommendation_events')
      .select('id')
      .eq('prompt_id', prompt.id)
      .eq('user_id', user.id)
      .eq('event_type', 'like')
      .maybeSingle();

    if (likeError) {
      console.error('Error checking like:', likeError);
      return NextResponse.json(
        { error: 'いいね状態の確認に失敗しました' },
        { status: 500 }
      );
    }

    // プロンプトのいいね数を取得
    const { data: updatedPrompt, error: countError } = await supabase
      .from('prompts')
      .select('like_count')
      .eq('id', prompt.id)
      .single();

    if (countError) {
      console.error('Error fetching prompt:', countError);
      return NextResponse.json(
        { error: 'プロンプトが見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      isLiked: !!existingLike,
      likeCount: updatedPrompt?.like_count || 0,
    });
  } catch (error) {
    console.error('Error in GET /api/prompts/[slug]/like:', error);
    return NextResponse.json(
      { error: 'いいね状態の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// いいねを追加または削除（トグル）
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createClient();
    const { slug } = await params;

    // 認証状態を確認
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // プロンプトIDを取得
    const { data: prompt, error: promptError } = await supabase
      .from('prompts')
      .select('id, status')
      .eq('slug', slug)
      .single();

    if (promptError || !prompt) {
      return NextResponse.json(
        { error: 'プロンプトが見つかりません' },
        { status: 404 }
      );
    }

    // 既にいいねしているかチェック
    const { data: existingLike, error: likeError } = await supabase
      .from('recommendation_events')
      .select('id')
      .eq('prompt_id', prompt.id)
      .eq('user_id', user.id)
      .eq('event_type', 'like')
      .maybeSingle();

    if (likeError) {
      console.error('Error checking like:', likeError);
      return NextResponse.json(
        { error: 'いいね状態の確認に失敗しました' },
        { status: 500 }
      );
    }

    let isLiked = false;
    let likeCount = 0;

    if (existingLike) {
      // いいねを削除
      const { error: deleteError } = await supabase
        .from('recommendation_events')
        .delete()
        .eq('id', existingLike.id);

      if (deleteError) {
        console.error('Error deleting like:', deleteError);
        return NextResponse.json(
          { error: 'いいねの削除に失敗しました' },
          { status: 500 }
        );
      }

      // プロンプトのいいね数を減らす
      const { error: updateError } = await supabase.rpc('decrement_like_count', {
        prompt_id: prompt.id
      });

      if (updateError) {
        console.error('Error calling decrement_like_count:', updateError);
        // RPCが存在しない場合は手動で更新
        const { data: currentPrompt } = await supabase
          .from('prompts')
          .select('like_count')
          .eq('id', prompt.id)
          .single();

        const newLikeCount = Math.max(0, (currentPrompt?.like_count || 0) - 1);
        const { error: manualUpdateError } = await supabase
          .from('prompts')
          .update({ like_count: newLikeCount })
          .eq('id', prompt.id);
        
        if (manualUpdateError) {
          console.error('Error manually updating like_count:', manualUpdateError);
        }

        likeCount = newLikeCount;
      } else {
        // RPCが成功した場合もいいね数を取得
        const { data: updatedPrompt } = await supabase
          .from('prompts')
          .select('like_count')
          .eq('id', prompt.id)
          .single();
        likeCount = updatedPrompt?.like_count || 0;
      }

      isLiked = false;
    } else {
      // いいねを追加
      const { data: newLike, error: insertError } = await supabase
        .from('recommendation_events')
        .insert({
          user_id: user.id,
          prompt_id: prompt.id,
          event_type: 'like',
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting like:', insertError);
        return NextResponse.json(
          { error: 'いいねの追加に失敗しました' },
          { status: 500 }
        );
      }

      // プロンプトのいいね数を増やす
      const { error: updateError } = await supabase.rpc('increment_like_count', {
        prompt_id: prompt.id
      });

      if (updateError) {
        console.error('Error calling increment_like_count:', updateError);
        // RPCが存在しない場合は手動で更新
        const { data: currentPrompt } = await supabase
          .from('prompts')
          .select('like_count')
          .eq('id', prompt.id)
          .single();

        const newLikeCount = (currentPrompt?.like_count || 0) + 1;
        const { error: manualUpdateError } = await supabase
          .from('prompts')
          .update({ like_count: newLikeCount })
          .eq('id', prompt.id);
        
        if (manualUpdateError) {
          console.error('Error manually updating like_count:', manualUpdateError);
        }

        likeCount = newLikeCount;
      } else {
        // RPCが成功した場合もいいね数を取得
        const { data: updatedPrompt } = await supabase
          .from('prompts')
          .select('like_count')
          .eq('id', prompt.id)
          .single();
        likeCount = updatedPrompt?.like_count || 0;
      }

      isLiked = true;
    }

    // 最終的ないいね数を取得
    const { data: finalPrompt, error: finalError } = await supabase
      .from('prompts')
      .select('like_count')
      .eq('id', prompt.id)
      .single();

    if (finalError) {
      console.error('Error fetching final like count:', finalError);
    }

    const finalLikeCount = finalPrompt?.like_count || likeCount;

    console.log('Like operation completed:', {
      isLiked,
      likeCount: finalLikeCount,
      promptId: prompt.id
    });

    return NextResponse.json({
      success: true,
      isLiked,
      likeCount: finalLikeCount,
    });
  } catch (error) {
    console.error('Error in POST /api/prompts/[slug]/like:', error);
    return NextResponse.json(
      { error: 'いいね処理に失敗しました' },
      { status: 500 }
    );
  }
}

