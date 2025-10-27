import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * GET /api/payouts
 * 出金申請履歴を取得
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // 出金申請履歴を取得
    const { data: payouts, error } = await supabase
      .from('payouts')
      .select('*')
      .eq('seller_id', user.id)
      .order('requested_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ payouts: payouts || [] });
  } catch (error) {
    console.error('出金申請取得エラー:', error);
    return NextResponse.json(
      { error: '出金申請の取得に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/payouts
 * 出金申請を作成
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { amount_jpy } = await request.json();

    if (!amount_jpy || amount_jpy <= 0) {
      return NextResponse.json(
        { error: '出金額は0より大きい必要があります' },
        { status: 400 }
      );
    }

    // 出品者残高を確認
    const { data: balance, error: balanceError } = await supabase
      .from('seller_balances')
      .select('available_jpy')
      .eq('seller_id', user.id)
      .single();

    if (balanceError || !balance) {
      return NextResponse.json(
        { error: '残高情報を取得できませんでした' },
        { status: 500 }
      );
    }

    if (balance.available_jpy < amount_jpy) {
      return NextResponse.json(
        { error: '利用可能残高が不足しています' },
        { status: 400 }
      );
    }

    // 出金アカウントを確認（簡易版：最初のアカウントを使用）
    const { data: accounts, error: accountError } = await supabase
      .from('seller_payout_accounts')
      .select('id')
      .eq('seller_id', user.id)
      .limit(1);

    // 出金アカウントがない場合は、仮のアカウントを作成
    let payoutAccountId: string;
    if (accounts && accounts.length > 0) {
      payoutAccountId = accounts[0].id;
    } else {
      // 仮の出金アカウントを作成
      const { data: newAccount, error: createAccountError } = await supabase
        .from('seller_payout_accounts')
        .insert({
          seller_id: user.id,
          provider: 'other',
          account_payload: { type: 'temporary' },
          verified: false
        })
        .select('id')
        .single();

      if (createAccountError || !newAccount) {
        return NextResponse.json(
          { error: '出金アカウントの作成に失敗しました' },
          { status: 500 }
        );
      }

      payoutAccountId = newAccount.id;
    }

    // 出金申請を作成
    const { data: payout, error: payoutError } = await supabase
      .from('payouts')
      .insert({
        seller_id: user.id,
        payout_account_id: payoutAccountId,
        amount_jpy: amount_jpy,
        status: 'requested'
      })
      .select()
      .single();

    if (payoutError) throw payoutError;

    // 残高から出金額を減算（トランザクション処理は簡易版としてスキップ）
    // 実際の本番環境では、出金申請後はreserved_jpyなどに移動する

    return NextResponse.json({ payout });
  } catch (error) {
    console.error('出金申請作成エラー:', error);
    return NextResponse.json(
      { error: '出金申請の作成に失敗しました' },
      { status: 500 }
    );
  }
}

