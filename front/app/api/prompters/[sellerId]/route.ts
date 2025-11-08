import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sellerId: string }> }
) {
  try {
    const { sellerId } = await params;
    
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
    
    // プロンプターのプロフィール情報を取得
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('user_id, display_name, avatar_url, bio')
      .eq('user_id', sellerId)
      .single();
    
    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'プロンプターが見つかりません' },
        { status: 404 }
      );
    }
    
    // 販売中のプロンプトを取得
    const { data: prompts, error: promptsError } = await supabaseAdmin
      .from('prompts')
      .select(`
        id,
        title,
        slug,
        thumbnail_url,
        price_jpy,
        short_description,
        avg_rating,
        ratings_count,
        like_count,
        view_count,
        created_at,
        categories(id, name)
      `)
      .eq('seller_id', sellerId)
      .eq('status', 'published')
      .eq('visibility', 'public')
      .order('created_at', { ascending: false });
    
    if (promptsError) {
      console.error('Error fetching prompts:', promptsError);
    }
    
    return NextResponse.json({
      seller: {
        user_id: profile.user_id,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
      },
      prompts: prompts || [],
    });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

