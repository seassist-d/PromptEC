import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

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
    
    // Service Role Keyを使用してRLSをバイパス（like_count更新用）
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

    // ユーザープロフィールの存在確認（外部キー制約エラーを防ぐため）
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error checking user profile:', profileError);
      return NextResponse.json(
        { error: 'プロフィールの確認に失敗しました' },
        { status: 500 }
      );
    }

    // プロフィールが存在しない場合は自動作成
    if (!userProfile) {
      // ユーザーのメタデータを取得するため、認証情報を再取得
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        return NextResponse.json(
          { error: '認証情報の取得に失敗しました' },
          { status: 401 }
        );
      }

      const { data: functionResult, error: functionError } = await supabaseAdmin
        .rpc('update_user_profile', {
          p_user_id: user.id,
          p_display_name: authUser.user_metadata?.display_name || authUser.email?.split('@')[0] || 'ユーザー',
          p_bio: null,
          p_contact: {},
          p_avatar_url: authUser.user_metadata?.avatar_url || null
        });

      if (functionError) {
        console.error('Error creating user profile:', functionError);
        return NextResponse.json(
          { error: 'プロフィールの作成に失敗しました' },
          { status: 500 }
        );
      }

      if (!functionResult || !functionResult[0]?.success) {
        console.error('Failed to create user profile:', functionResult);
        return NextResponse.json(
          { error: 'プロフィールの作成に失敗しました' },
          { status: 500 }
        );
      }
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
      // まず現在のいいね数を取得（Service Role Keyを使用）
      const { data: currentPrompt, error: fetchError } = await supabaseAdmin
        .from('prompts')
        .select('like_count')
        .eq('id', prompt.id)
        .single();

      const currentLikeCount = currentPrompt?.like_count || 0;
      
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

      // プロンプトのいいね数を減らす（Service Role Keyを使用）
      
      const newLikeCount = Math.max(0, currentLikeCount - 1);
      const { error: updateError } = await supabaseAdmin
        .from('prompts')
        .update({ like_count: newLikeCount })
        .eq('id', prompt.id);
      
      if (updateError) {
        console.error('Error manually updating like_count:', updateError);
        // RPC関数を試す
        const { error: rpcError } = await supabaseAdmin.rpc('decrement_like_count', {
          prompt_id: prompt.id
        });
        
        if (rpcError) {
          console.error('Error calling decrement_like_count:', rpcError);
          likeCount = newLikeCount;
        } else {
          // RPC関数が成功したので、データベースから最新の値を取得
          await new Promise(resolve => setTimeout(resolve, 50));
          const { data: updatedPrompt } = await supabaseAdmin
            .from('prompts')
            .select('like_count')
            .eq('id', prompt.id)
            .single();
          likeCount = updatedPrompt?.like_count || newLikeCount;
        }
      } else {
        // 手動更新が成功したので、データベースから最新の値を取得
        await new Promise(resolve => setTimeout(resolve, 50));
        const { data: updatedPrompt } = await supabaseAdmin
          .from('prompts')
          .select('like_count')
          .eq('id', prompt.id)
          .single();
        likeCount = updatedPrompt?.like_count || newLikeCount;
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

      // まず現在のいいね数を取得（Service Role Keyを使用）
      const { data: currentPrompt } = await supabaseAdmin
        .from('prompts')
        .select('like_count')
        .eq('id', prompt.id)
        .single();

      const currentLikeCount = currentPrompt?.like_count || 0;

      // トリガーが動作するのを待つ（200ms）
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // トリガー後の値を確認（Service Role Keyを使用）
      const { data: triggerPrompt } = await supabaseAdmin
        .from('prompts')
        .select('like_count')
        .eq('id', prompt.id)
        .single();
      
      const triggerLikeCount = triggerPrompt?.like_count || 0;

      // トリガーが動作していない場合（値が変わっていない場合）、手動で更新（Service Role Keyを使用）
      if (triggerLikeCount === currentLikeCount) {
        const newLikeCount = currentLikeCount + 1;
        const { error: manualUpdateError } = await supabaseAdmin
          .from('prompts')
          .update({ like_count: newLikeCount })
          .eq('id', prompt.id);
        
        if (manualUpdateError) {
          console.error('Error manually updating like_count:', manualUpdateError);
          // RPC関数を試す（Service Role Keyを使用）
          const { error: rpcError } = await supabaseAdmin.rpc('increment_like_count', {
            prompt_id: prompt.id
          });
          
          if (rpcError) {
            console.error('Error calling increment_like_count:', rpcError);
            likeCount = newLikeCount;
          } else {
            // RPC関数が成功したので、データベースから最新の値を取得
            await new Promise(resolve => setTimeout(resolve, 50));
            const { data: updatedPrompt } = await supabaseAdmin
              .from('prompts')
              .select('like_count')
              .eq('id', prompt.id)
              .single();
            likeCount = updatedPrompt?.like_count || newLikeCount;
          }
        } else {
          // 手動更新が成功したので、データベースから最新の値を取得
          await new Promise(resolve => setTimeout(resolve, 50));
          const { data: updatedPrompt } = await supabaseAdmin
            .from('prompts')
            .select('like_count')
            .eq('id', prompt.id)
            .single();
          likeCount = updatedPrompt?.like_count || newLikeCount;
        }
      } else {
        // トリガーが動作したので、その値を使用
        likeCount = triggerLikeCount;
      }
      
      // 最終確認: データベースから最新の値を取得（Service Role Keyを使用、複数回リトライ）
      let finalLikeCount = likeCount;
      for (let i = 0; i < 3; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const { data: finalPrompt } = await supabaseAdmin
          .from('prompts')
          .select('like_count')
          .eq('id', prompt.id)
          .single();
        
        if (finalPrompt?.like_count !== undefined) {
          finalLikeCount = finalPrompt.like_count;
          if (finalLikeCount > 0) break; // 正しい値が取得できたら終了
        }
      }
      likeCount = finalLikeCount;

      isLiked = true;
    }

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

