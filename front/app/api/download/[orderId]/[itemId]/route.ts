import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string; itemId: string }> }
) {
  try {
    const supabase = await createClient();
    
    // 認証確認
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { orderId, itemId } = await params;

    // 注文アイテムが存在し、ユーザーの注文であることを確認
    const { data: orderItem, error: itemError } = await supabase
      .from('order_items')
      .select(`
        id,
        prompt_id,
        prompt_version_id,
        order_id,
        orders!inner (
          id,
          buyer_id,
          status
        )
      `)
      .eq('id', itemId)
      .eq('order_id', orderId)
      .single();

    if (itemError || !orderItem || orderItem.orders.buyer_id !== user.id) {
      return NextResponse.json(
        { error: '注文アイテムが見つかりません' },
        { status: 404 }
      );
    }

    // 注文が支払い完了していることを確認
    if (orderItem.orders.status !== 'paid') {
      return NextResponse.json(
        { error: 'この注文はまだ支払いが完了していません' },
        { status: 400 }
      );
    }

    // Entitlements（所有権）があるか確認
    const { data: entitlement, error: entitleError } = await supabase
      .from('entitlements')
      .select('id')
      .eq('order_item_id', itemId)
      .eq('buyer_id', user.id)
      .single();

    if (entitleError || !entitlement) {
      return NextResponse.json(
        { error: 'ダウンロード権限がありません' },
        { status: 403 }
      );
    }

    // プロンプトバージョンとアセットを取得
    const { data: promptVersion, error: versionError } = await supabase
      .from('prompt_versions')
      .select(`
        id,
        version,
        title_snapshot,
        description_snapshot,
        content_type,
        prompt_assets (
          id,
          kind,
          text_content,
          storage_path
        )
      `)
      .eq('id', orderItem.prompt_version_id)
      .single();

    if (versionError || !promptVersion) {
      return NextResponse.json(
        { error: 'プロンプトの内容が見つかりません' },
        { status: 404 }
      );
    }

    // テキストコンテンツを取得
    const textAsset = promptVersion.prompt_assets?.find(
      (asset: any) => asset.kind === 'text_body'
    );

    if (!textAsset?.text_content) {
      return NextResponse.json(
        { error: 'プロンプトの内容がありません' },
        { status: 404 }
      );
    }

    // ファイルとしてダウンロード
    const filename = `${orderItem.orders.order_number}_${promptVersion.title_snapshot}.txt`;
    
    return new NextResponse(textAsset.text_content, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });

  } catch (error) {
    console.error('ダウンロードエラー:', error);
    return NextResponse.json(
      { error: 'ダウンロードに失敗しました' },
      { status: 500 }
    );
  }
}

