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

    console.log('Existing like check:', {
      hasExistingLike: !!existingLike,
      existingLikeId: existingLike?.id,
      user_id: user.id,
      prompt_id: prompt.id
    });

    let isLiked = false;
    let likeCount = 0;

    if (existingLike) {
      console.log('Existing like found, deleting...');
      
      // まず現在のいいね数を取得
      const { data: currentPrompt, error: fetchError } = await supabase
        .from('prompts')
        .select('like_count')
        .eq('id', prompt.id)
        .single();

      const currentLikeCount = currentPrompt?.like_count || 0;
      console.log('Step 1 - Current like count before decrement:', currentLikeCount);
      console.log('Step 2 - Should decrement to:', Math.max(0, currentLikeCount - 1));
      console.log('Step 3 - About to delete like from recommendation_events');
      
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

      console.log('Like deleted successfully from recommendation_events');

      // プロンプトのいいね数を減らす
      console.log('Attempting to decrement like count for prompt:', prompt.id);
      
      const { error: updateError } = await supabase.rpc('decrement_like_count', {
        prompt_id: prompt.id
      });

      if (updateError) {
        console.error('Error calling decrement_like_count:', updateError);
        console.log('Falling back to manual update');
        
        const newLikeCount = Math.max(0, currentLikeCount - 1);
        console.log('Step 4 - Manually updating like count from', currentLikeCount, 'to', newLikeCount);
        
        // UPDATEを実行（.single()なし）
        const { error: updateResponseError } = await supabase
          .from('prompts')
          .update({ like_count: newLikeCount })
          .eq('id', prompt.id);
        
        console.log('Update query error:', updateResponseError);
        
        if (updateResponseError) {
          console.error('Error updating like_count:', updateResponseError);
          likeCount = Math.max(0, currentLikeCount - 1);
          console.log('Using calculated value:', likeCount);
        } else {
          // 更新後の値を取得
          const { data: updatedPrompt } = await supabase
            .from('prompts')
            .select('like_count')
            .eq('id', prompt.id)
            .single();
          
          console.log('Updated prompt from DB:', updatedPrompt?.like_count);
          const updatedCount = updatedPrompt?.like_count ?? Math.max(0, currentLikeCount - 1);
          console.log('Manual update successful, using count:', updatedCount);
          likeCount = updatedCount;
        }
      } else {
        console.log('RPC decrement_like_count successful');
        // 計算値を使用（RPC関数が成功したので、currentLikeCount - 1が正しい）
        likeCount = Math.max(0, currentLikeCount - 1);
        console.log('Calculated like count after RPC:', likeCount);
      }

      isLiked = false;
    } else {
      console.log('No existing like, adding new like...');
      
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

      console.log('Like inserted successfully:', newLike.id);

      // まず現在のいいね数を取得
      const { data: currentPrompt, error: fetchError } = await supabase
        .from('prompts')
        .select('like_count')
        .eq('id', prompt.id)
        .single();

      const currentLikeCount = currentPrompt?.like_count || 0;
      console.log('Current like count before increment:', currentLikeCount);

      // プロンプトのいいね数を増やす
      console.log('Attempting to increment like count for prompt:', prompt.id);
      
      const { error: updateError } = await supabase.rpc('increment_like_count', {
        prompt_id: prompt.id
      });

      if (updateError) {
        console.error('Error calling increment_like_count:', updateError);
        console.log('Falling back to manual update');
        
        const newLikeCount = currentLikeCount + 1;
        console.log('Manually updating like count to:', newLikeCount);
        
        // UPDATEを実行（.single()なし）
        const { error: updateResponseError } = await supabase
          .from('prompts')
          .update({ like_count: newLikeCount })
          .eq('id', prompt.id);
        
        console.log('Update query error:', updateResponseError);
        
        if (updateResponseError) {
          console.error('Error updating like_count:', updateResponseError);
          likeCount = currentLikeCount + 1;
        } else {
          // 更新後の値を取得
          const { data: updatedPrompt } = await supabase
            .from('prompts')
            .select('like_count')
            .eq('id', prompt.id)
            .single();
          
          console.log('Updated prompt from DB:', updatedPrompt?.like_count);
          const updatedCount = updatedPrompt?.like_count ?? (currentLikeCount + 1);
          console.log('Manual update successful, using count:', updatedCount);
          likeCount = updatedCount;
        }
      } else {
        console.log('RPC increment_like_count successful');
        // RPC関数が成功したので、計算値を使用
        likeCount = currentLikeCount + 1;
        console.log('Calculated like count after RPC:', likeCount);
      }

      isLiked = true;
    }

    // 計算された値をそのまま使用（データベースに再アクセスしない）
    console.log('Like operation completed:', {
      isLiked,
      likeCount: likeCount,
      promptId: prompt.id
    });

    return NextResponse.json({
      success: true,
      isLiked,
      likeCount: likeCount,  // 計算された値を使用
    });
  } catch (error) {
    console.error('Error in POST /api/prompts/[slug]/like:', error);
    return NextResponse.json(
      { error: 'いいね処理に失敗しました' },
      { status: 500 }
    );
  }
}

