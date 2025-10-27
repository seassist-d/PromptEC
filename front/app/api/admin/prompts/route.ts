import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * GET: プロンプト一覧取得（管理者用）
 * ?status=pending, published, suspended, deleted
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // 認証・管理者チェック
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 403 }
      );
    }

    // プロンプト一覧取得
    let query = supabase
      .from('prompts')
      .select(`
        id,
        slug,
        title,
        short_description,
        long_description,
        price_jpy,
        status,
        visibility,
        like_count,
        view_count,
        ratings_count,
        avg_rating,
        created_at,
        updated_at,
        seller_id
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // ステータスフィルター
    if (status && status !== '') {
      query = query.eq('status', status);
    }

    // ページネーション
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: prompts, error, count } = await query;

    if (error) {
      console.error('プロンプト取得エラー:', error);
      throw error;
    }

    // 出品者情報を個別に取得（管理者は全ユーザー情報にアクセス可能）
    const promptsWithSellers = await Promise.all(
      (prompts || []).map(async (prompt) => {
        try {
          const { data: seller } = await supabase
            .from('user_profiles')
            .select('display_name, avatar_url')
            .eq('user_id', prompt.seller_id)
            .single();

          // emailはauth.usersから取得
          const { data: authUser } = await supabase.auth.admin.getUserById(prompt.seller_id);
          
          return {
            ...prompt,
            user_profiles: {
              display_name: seller?.display_name || null,
              avatar_url: seller?.avatar_url || null,
              email: authUser?.user?.email || ''
            }
          };
        } catch (error) {
          console.error('出品者情報取得エラー:', error);
          return {
            ...prompt,
            user_profiles: { display_name: null, avatar_url: null, email: '' }
          };
        }
      })
    );

    return NextResponse.json({
      prompts: promptsWithSellers || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { 
        error: 'エラーが発生しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

