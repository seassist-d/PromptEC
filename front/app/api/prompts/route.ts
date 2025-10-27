import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { message: '認証が必要です' },
        { status: 401 }
      );
    }

    // ユーザーのプロンプトを取得
    const { data: prompts, error } = await supabase
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
        categories(id, name, slug)
      `)
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user prompts:', error);
      
      // プロンプトが存在しない場合でもエラーを返さない
      if (error.code === 'PGRST116' || error.message?.includes('No rows')) {
        return NextResponse.json({
          prompts: []
        });
      }
      
      return NextResponse.json(
        { message: 'プロンプトの取得に失敗しました', details: error.message },
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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { message: '認証が必要です' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, description, content, category_id, price, tags, thumbnail_url } = body;

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

    // スラッグを生成（タイトルから）
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');

    // プロンプトを作成（データベース構造に合わせて修正）
    const insertData: Record<string, unknown> = {
      title,
      short_description: description,
      long_description: content,
      category_id: parseInt(category_id),
      price_jpy: parseFloat(price),
      seller_id: user.id,
      slug: `${slug}-${Date.now()}`,
      status: 'published',
      visibility: 'public'
    };

    // サムネイル画像URLがある場合のみ追加
    if (thumbnail_url && thumbnail_url.trim()) {
      insertData.thumbnail_url = thumbnail_url;
    }

    const { data: prompt, error: promptError } = await supabase
      .from('prompts')
      .insert(insertData)
      .select()
      .single();

    if (promptError) {
      console.error('Prompt creation error:', promptError);
      return NextResponse.json(
        { message: 'プロンプトの作成に失敗しました', details: promptError.message },
        { status: 500 }
      );
    }

    // プロンプトのバージョン1を作成
    const { data: promptVersion, error: versionError } = await supabase
      .from('prompt_versions')
      .insert({
        prompt_id: prompt.id,
        version: 1,
        title_snapshot: title,
        description_snapshot: description,
        sample_output_snapshot: content,
        content_type: 'text',
        published_at: new Date().toISOString()
      })
      .select()
      .single();

    if (versionError) {
      console.error('Prompt version creation error:', versionError);
      console.warn('警告: プロンプトバージョンの作成に失敗しました。購入機能に影響する可能性があります。');
    } else if (promptVersion) {
      // プロンプトアセットを作成（ダウンロード用）
      const { error: assetError } = await supabase
        .from('prompt_assets')
        .insert({
          prompt_version_id: promptVersion.id,
          kind: 'text_body',
          text_content: content,
          size_bytes: new TextEncoder().encode(content).length
        });

      if (assetError) {
        console.error('Prompt asset creation error:', assetError);
        console.warn('警告: プロンプトアセットの作成に失敗しました。ダウンロード機能に影響する可能性があります。');
      }
    }

    // タグを追加（tagsテーブルとprompt_tagsテーブルを使用）
    if (tags && tags.length > 0) {
      try {
        // 各タグをtagsテーブルに追加（存在しない場合のみ）
        const tagPromises = tags.map(async (tagName: string) => {
          const trimmedTag = tagName.trim();
          if (!trimmedTag) return null;

          // タグが既に存在するかチェック
          const { data: existingTag } = await supabase
            .from('tags')
            .select('id')
            .eq('name', trimmedTag)
            .single();

          if (existingTag) {
            return existingTag.id;
          }

          // 新しいタグを作成
          const { data: newTag, error: tagError } = await supabase
            .from('tags')
            .insert({
              name: trimmedTag,
              slug: trimmedTag.toLowerCase().replace(/[^a-z0-9-]/g, '-')
            })
            .select('id')
            .single();

          if (tagError) {
            console.error('Tag creation error:', tagError);
            return null;
          }

          return newTag.id;
        });

        const tagIds = await Promise.all(tagPromises);
        const validTagIds = tagIds.filter(id => id !== null);

        // prompt_tagsテーブルに関連付けを追加
        if (validTagIds.length > 0) {
          const promptTagInserts = validTagIds.map(tagId => ({
            prompt_id: prompt.id,
            tag_id: tagId
          }));

          const { error: promptTagError } = await supabase
            .from('prompt_tags')
            .insert(promptTagInserts);

          if (promptTagError) {
            console.error('Prompt tag association error:', promptTagError);
            // タグの関連付けに失敗してもプロンプトは作成済みなので、警告のみ
          }
        }
      } catch (tagError) {
        console.error('Tag processing error:', tagError);
        // タグ処理に失敗してもプロンプトは作成済みなので、警告のみ
      }
    }

    return NextResponse.json({
      message: 'プロンプトが正常に作成されました',
      prompt
    }, { status: 201 });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
