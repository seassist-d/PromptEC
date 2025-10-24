import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createClient();
    const { slug } = await params;

    // プロンプト詳細を取得（カテゴリと出品者情報を含む）
    const { data: prompt, error } = await supabase
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
        long_description,
        sample_output,
        avg_rating,
        ratings_count,
        view_count,
        like_count,
        created_at,
        updated_at,
        status,
        categories!inner(id, name, slug),
        user_profiles!prompts_seller_id_fkey(
          user_id,
          display_name,
          avatar_url
        )
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .eq('visibility', 'public')
      .single();

    if (error) {
      console.error('Error fetching prompt:', error);
      return NextResponse.json(
        { error: 'プロンプトが見つかりません' },
        { status: 404 }
      );
    }

    if (!prompt) {
      return NextResponse.json(
        { error: 'プロンプトが見つかりません' },
        { status: 404 }
      );
    }

    // レビュー情報を取得
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        updated_at,
        user_profiles!reviews_user_id_fkey(
          display_name,
          avatar_url
        )
      `)
      .eq('prompt_id', prompt.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
    }

    // 関連プロンプトを取得（同じカテゴリの他のプロンプト）
    const { data: relatedPrompts, error: relatedError } = await supabase
      .from('prompts')
      .select(`
        id,
        title,
        slug,
        thumbnail_url,
        price_jpy,
        avg_rating,
        ratings_count,
        created_at,
        categories!inner(name)
      `)
      .eq('category_id', prompt.category_id)
      .eq('status', 'published')
      .eq('visibility', 'public')
      .neq('id', prompt.id)
      .order('avg_rating', { ascending: false })
      .limit(4);

    if (relatedError) {
      console.error('Error fetching related prompts:', relatedError);
    }

    // ビュー数を増加（非同期で実行）
    supabase
      .from('prompts')
      .update({ view_count: (prompt.view_count || 0) + 1 })
      .eq('id', prompt.id)
      .then(({ error }) => {
        if (error) {
          console.error('Error updating view count:', error);
        }
      });

    // レスポンス用のデータを整形
    const responseData = {
      id: prompt.id,
      title: prompt.title,
      slug: prompt.slug,
      short_description: prompt.short_description,
      long_description: prompt.long_description,
      sample_output: prompt.sample_output,
      price_jpy: prompt.price_jpy,
      thumbnail_url: prompt.thumbnail_url,
      avg_rating: prompt.avg_rating,
      ratings_count: prompt.ratings_count || 0,
      view_count: prompt.view_count || 0,
      like_count: prompt.like_count || 0,
      created_at: prompt.created_at,
      updated_at: prompt.updated_at,
      category_id: prompt.category_id,
      category_name: prompt.categories?.name || '未分類',
      category_slug: prompt.categories?.slug || '',
      seller_id: prompt.seller_id,
      seller_name: prompt.user_profiles?.display_name || '不明',
      seller_avatar: prompt.user_profiles?.avatar_url,
      reviews: (reviews || []).map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        created_at: review.created_at,
        user_name: review.user_profiles?.display_name || '不明',
        user_avatar: review.user_profiles?.avatar_url,
      })),
      related_prompts: (relatedPrompts || []).map(related => ({
        id: related.id,
        title: related.title,
        slug: related.slug,
        thumbnail_url: related.thumbnail_url,
        price_jpy: related.price_jpy,
        avg_rating: related.avg_rating,
        ratings_count: related.ratings_count || 0,
        created_at: related.created_at,
        category_name: related.categories?.name || '未分類',
      })),
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
