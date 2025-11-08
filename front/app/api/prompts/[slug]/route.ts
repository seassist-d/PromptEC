import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface UserProfile {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
}

interface Review {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
  user_profiles: UserProfile | null;
}

interface Prompt {
  id: number;
  title: string;
  slug: string;
  seller_id: string;
  category_id: number;
  thumbnail_url: string | null;
  price_jpy: number;
  short_description: string;
  long_description: string;
  sample_output: string | null;
  avg_rating: number | null;
  ratings_count: number | null;
  view_count: number | null;
  like_count: number | null;
  created_at: string;
  updated_at: string;
  status: string;
  visibility: string;
  categories: Category | null;
  user_profiles: UserProfile | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createClient();
    const { slug } = await params;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let query = supabase
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
        visibility,
        categories(id, name, slug),
        user_profiles!prompts_seller_id_fkey(
          user_id,
          display_name,
          avatar_url
        )
      `)
      .eq('slug', slug);

    if (user) {
      query = query.or(
        `seller_id.eq.${user.id},and(status.eq.published,visibility.eq.public)`
      );
    } else {
      query = query.eq('status', 'published').eq('visibility', 'public');
    }

    const { data: prompt, error } = await query.single<Prompt>();

    if (error || !prompt) {
      return NextResponse.json(
        { error: 'プロンプトが見つかりません' },
        { status: 404 }
      );
    }

    // ここから通常のレスポンス組み立て
    // レビュー
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
      .limit(10)
      .returns<Review[]>();

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
    }

    // 関連プロンプト
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
        categories(name)
      `)
      .eq('category_id', prompt.category_id)
      .eq('status', 'published')
      .eq('visibility', 'public')
      .neq('id', prompt.id)
      .order('avg_rating', { ascending: false })
      .limit(4)
      .returns<Prompt[]>();

    if (relatedError) {
      console.error('Error fetching related prompts:', relatedError);
    }

    // ビュー数+1（失敗しても無視）
    supabase
      .from('prompts')
      .update({ view_count: (prompt.view_count ?? 0) + 1 })
      .eq('id', prompt.id)
      .then(({ error: viewErr }) => {
        if (viewErr) console.error('Error updating view count:', viewErr);
      });

    // カテゴリーIDからUIカテゴリー名へのマッピング（SearchFilters.tsxの固定リストと一致）
    const categoryIdToUiNameMap: Record<number, string> = {
      1: 'ライター・編集者',
      2: '営業・カスタマーサポート',
      3: 'デザイナー・クリエイター',
      4: 'プログラマー・開発者',
      5: '人事・採用担当',
      6: '経営者・マネージャー',
      7: '金融・会計',
      8: 'マーケティング・広告',
      9: '医療・ヘルスケア',
      10: '研究・開発',
    };

    const getUiCategoryName = (categoryId: number | null, dbCategoryName: string | null | undefined): string => {
      if (categoryId && categoryIdToUiNameMap[categoryId]) {
        return categoryIdToUiNameMap[categoryId];
      }
      return dbCategoryName || '未分類';
    };

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
      ratings_count: prompt.ratings_count ?? 0,
      view_count: prompt.view_count ?? 0,
      like_count: prompt.like_count ?? 0,
      created_at: prompt.created_at,
      updated_at: prompt.updated_at,
      category_id: prompt.category_id,
      category_name: getUiCategoryName(prompt.category_id, prompt.categories?.name),
      category_slug: prompt.categories?.slug ?? '',
      seller_id: prompt.seller_id,
      seller_name: prompt.user_profiles?.display_name ?? '不明',
      seller_avatar: prompt.user_profiles?.avatar_url,
      status: prompt.status,
      visibility: prompt.visibility,
      reviews: (reviews ?? []).map(r => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at,
        user_name: r.user_profiles?.display_name ?? '不明',
        user_avatar: r.user_profiles?.avatar_url ?? null,
      })),
      related_prompts: (relatedPrompts ?? []).map(rp => ({
        id: rp.id,
        title: rp.title,
        slug: rp.slug,
        thumbnail_url: rp.thumbnail_url,
        price_jpy: rp.price_jpy,
        avg_rating: rp.avg_rating,
        ratings_count: rp.ratings_count ?? 0,
        created_at: rp.created_at,
        category_name: getUiCategoryName(rp.category_id, rp.categories?.name),
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createClient();
    const { slug } = await params;

    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { message: '認証が必要です' },
        { status: 401 }
      );
    }

    // 既存のプロンプトを取得
    const { data: existingPrompt, error: fetchError } = await supabase
      .from('prompts')
      .select('id, seller_id')
      .eq('slug', slug)
      .single();

    if (fetchError || !existingPrompt) {
      return NextResponse.json(
        { message: 'プロンプトが見つかりません' },
        { status: 404 }
      );
    }

    // 所有者チェック
    if (existingPrompt.seller_id !== user.id) {
      return NextResponse.json(
        { message: 'このプロンプトを編集する権限がありません' },
        { status: 403 }
      );
    }

    // リクエストボディを取得
    const body = await request.json();
    const { title, description, content, category_id, price, thumbnail_url } = body;

    // バリデーション
    if (!title || !description || !content || !category_id || price === undefined || price === null) {
      return NextResponse.json(
        { message: '必須フィールドが不足しています' },
        { status: 400 }
      );
    }

    if (price < 0) {
      return NextResponse.json(
        { message: '価格は0以上である必要があります' },
        { status: 400 }
      );
    }

    // 更新データを準備
    const updateData: Record<string, unknown> = {
      title: title.trim(),
      short_description: description.trim(),
      long_description: content.trim(),
      category_id: parseInt(category_id),
      price_jpy: parseFloat(price),
      updated_at: new Date().toISOString(),
    };

    // サムネイル画像URLがある場合のみ追加
    if (thumbnail_url !== undefined && thumbnail_url !== null) {
      if (thumbnail_url.trim()) {
        updateData.thumbnail_url = thumbnail_url.trim();
      } else {
        updateData.thumbnail_url = null;
      }
    }

    // プロンプトを更新
    const { data: updatedPrompt, error: updateError } = await supabase
      .from('prompts')
      .update(updateData)
      .eq('id', existingPrompt.id)
      .select()
      .single();

    if (updateError) {
      console.error('Prompt update error:', updateError);
      return NextResponse.json(
        { message: 'プロンプトの更新に失敗しました', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'プロンプトが正常に更新されました',
      prompt: updatedPrompt
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
