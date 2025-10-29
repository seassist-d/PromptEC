import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
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
    
    // 人気プロンプトを評価順で取得（評価が高い順、評価数が多い順）
    const { data: prompts, error } = await supabaseAdmin
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
        status,
        visibility,
        categories(id, name, slug)
      `)
      .eq('status', 'published')
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(6);

    if (error) {
      console.error('Error fetching popular prompts:', error);
      return NextResponse.json(
        { message: '人気プロンプトの取得に失敗しました', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      prompts: prompts || []
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
