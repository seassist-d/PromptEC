# Supabase設定手順

## 1. 環境変数の設定

プロジェクトルートに `.env.local` ファイルを作成し、以下の環境変数を設定してください：

```env
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI SDK設定（既存の設定があれば追加）
# OPENAI_API_KEY=your_openai_api_key
# GOOGLE_AI_API_KEY=your_google_ai_api_key
```

## 2. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)にアクセス
2. 新しいプロジェクトを作成
3. プロジェクトのURLとAPIキーを取得
4. 上記の環境変数に設定

## 3. 設定ファイルの説明

### `lib/supabase.ts`
- クライアントサイド用のSupabaseクライアント
- サーバーサイド用のSupabaseクライアント（管理者権限）
- 型付きクライアント（TypeScript対応）

### `lib/database.types.ts`
- データベースの型定義
- テーブル構造の型安全性を提供
- 後でSupabase CLIで自動生成することも可能

## 4. 使用方法

```typescript
import { supabase, supabaseTyped } from '@/lib/supabase'

// 基本的な使用方法
const { data, error } = await supabase
  .from('user_profiles')
  .select('*')

// 型付きクライアントの使用
const { data, error } = await supabaseTyped
  .from('user_profiles')
  .select('*')
```

## 5. 次のステップ

1. Supabaseプロジェクトの作成
2. データベーススキーマの実装
3. 認証機能の実装
4. RLSポリシーの設定
