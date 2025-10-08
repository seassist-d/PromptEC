import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Supabaseの設定
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// 環境変数の検証
if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}
if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}
if (!supabaseServiceRoleKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
}

// クライアントサイド用のSupabaseクライアント
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // 認証状態の永続化設定
    persistSession: true,
    // 自動リフレッシュ
    autoRefreshToken: true,
    // セッションの検出
    detectSessionInUrl: true
  }
})

// サーバーサイド用のSupabaseクライアント（Service Role Key使用）
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      // サーバーサイドではセッション管理を無効化
      persistSession: false,
      autoRefreshToken: false
    }
  }
)

// 型付きクライアント
export const supabaseTyped = createClient<Database>(supabaseUrl, supabaseAnonKey)
export const supabaseAdminTyped = createClient<Database>(
  supabaseUrl,
  supabaseServiceRoleKey
)
