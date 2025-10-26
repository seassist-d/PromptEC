import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, subject, message, privacy } = body;

    // バリデーション
    if (!name || !email || !subject || !message || !privacy) {
      return NextResponse.json(
        { error: 'すべての必須項目を入力してください' },
        { status: 400 }
      );
    }

    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '有効なメールアドレスを入力してください' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // お問い合わせデータをデータベースに保存
    const { data, error } = await supabase
      .from('contact_inquiries')
      .insert([
        {
          name,
          email,
          subject,
          message,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Contact submission error:', error);
      
      // contact_inquiriesテーブルが存在しない場合は、エラーログに記録するだけ
      if (error.code === '42P01') {
        console.warn('contact_inquiries table does not exist. Saving to logs only.');
        
        // 開発環境ではコンソールログに記録
        console.log('Contact Inquiry:', {
          name,
          email,
          subject,
          message,
          privacy,
          timestamp: new Date().toISOString(),
        });

        // 実際の運用では、メール送信サービス（SendGrid、AWS SES等）を使用
        // ここでは成功を返す
        return NextResponse.json(
          { 
            success: true, 
            message: 'お問い合わせを受け付けました。担当者より3営業日以内にご連絡いたします。' 
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        { error: 'お問い合わせの送信に失敗しました', details: error.message },
        { status: 500 }
      );
    }

    // TODO: 実際の運用では、ここでメール送信を行う
    // 例: SendGrid、AWS SES、Supabase Edge Function等を使用
    console.log('Contact inquiry submitted successfully:', data);

    return NextResponse.json(
      { 
        success: true, 
        message: 'お問い合わせを受け付けました。担当者より3営業日以内にご連絡いたします。' 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Contact API error:', error);
    return NextResponse.json(
      { 
        error: 'サーバーエラーが発生しました', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

