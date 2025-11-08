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
    
    // プロンプターのプロフィールが存在するか確認
    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .select('user_id')
      .eq('user_id', sellerId)
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error checking seller profile:', error);
      return NextResponse.json(
        { exists: false, error: error.message },
        { status: 500 }
      );
    }
    
    // 販売中のプロンプトが存在するか確認
    const { data: activePrompts, error: promptsError } = await supabaseAdmin
      .from('prompts')
      .select('id')
      .eq('seller_id', sellerId)
      .eq('status', 'published')
      .eq('visibility', 'public')
      .limit(1);
    
    if (promptsError) {
      console.error('Error checking active prompts:', promptsError);
      return NextResponse.json(
        { exists: false, error: promptsError.message },
        { status: 500 }
      );
    }
    
    // プロフィールが存在し、かつ販売中のプロンプトが存在する場合のみtrue
    const exists = !!profile && !!activePrompts && activePrompts.length > 0;
    
    return NextResponse.json({ exists });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { exists: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

