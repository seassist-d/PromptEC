import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// ユーザーがいいねしたプロンプト一覧を取得
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 認証状態を確認
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // ユーザーがいいねしたプロンプトIDを取得
    const { data: likedEvents, error: likeError } = await supabase
      .from('recommendation_events')
      .select('prompt_id, event_time')
      .eq('user_id', user.id)
      .eq('event_type', 'like')
      .order('event_time', { ascending: false });

    if (likeError) {
      console.error('Error fetching liked prompts:', likeError);
      return NextResponse.json(
        { error: 'いいね一覧の取得に失敗しました' },
        { status: 500 }
      );
    }

    // いいねが存在しない場合
    if (!likedEvents || likedEvents.length === 0) {
      return NextResponse.json({
        prompts: []
      });
    }

    // プロンプトIDのリストを取得
    const promptIds = likedEvents.map(event => event.prompt_id);

    // プロンプト詳細を取得
    const { data: prompts, error: promptsError } = await supabase
      .from('prompts')
      .select(`
        id,
        title,
        slug,
        seller_id,
        category_id,
        thumbnail_url,
        price_jpy,
        short_description,
        avg_rating,
        ratings_count,
        view_count,
        like_count,
        created_at,
        categories(id, name, slug),
        user_profiles!prompts_seller_id_fkey(
          user_id,
          display_name,
          avatar_url
        )
      `)
      .in('id', promptIds)
      .eq('status', 'published')
      .eq('visibility', 'public');

    if (promptsError) {
      console.error('Error fetching prompts:', promptsError);
      return NextResponse.json(
        { error: 'プロンプトの取得に失敗しました' },
        { status: 500 }
      );
    }

    // いいね時刻でソート（新しい順）
    const sortedPrompts = (prompts || []).sort((a, b) => {
      const aLike = likedEvents.find(e => e.prompt_id === a.id);
      const bLike = likedEvents.find(e => e.prompt_id === b.id);
      const aTime = aLike ? new Date(aLike.event_time).getTime() : 0;
      const bTime = bLike ? new Date(bLike.event_time).getTime() : 0;
      return bTime - aTime;
    });

    return NextResponse.json({
      prompts: sortedPrompts
    });

  } catch (error) {
    console.error('Error in GET /api/prompts/liked:', error);
    return NextResponse.json(
      { error: 'いいね一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

