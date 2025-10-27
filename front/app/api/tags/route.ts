import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    
    // タグデータを取得
    let tagsQuery = supabase
      .from('tags')
      .select('id, name, slug')
      .order('name', { ascending: true })
      .limit(20);

    // 検索クエリがある場合はフィルタリング
    if (query) {
      tagsQuery = tagsQuery.ilike('name', `%${query}%`);
    }

    const { data: tags, error } = await tagsQuery;

    if (error) {
      console.error('Tags fetch error:', error);
      return NextResponse.json(
        { error: 'タグの取得に失敗しました', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      tags: tags || []
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

