# Supabase認証機能の実装

## 概要
Server Actionを使用してSupabaseの新規登録機能を実装しました。APIキーがクライアントサイドに露出しない安全な実装になっています。

## 実装内容

### 1. Server Action (`app/actions/auth.ts`)
- `signUpAction`: 新規登録用のServer Action
- バリデーション機能付き
- エラーハンドリング実装
- Supabase Admin APIを使用してサーバーサイドで認証処理

### 2. 新規登録フォーム (`app/components/SignUpForm.tsx`)
- React Hook Formを使用したフォーム
- リアルタイムバリデーション
- ローディング状態の管理
- エラーメッセージの表示

### 3. 環境変数設定 (`.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

## セットアップ手順

1. Supabaseプロジェクトの設定
   - [Supabaseダッシュボード](https://supabase.com/dashboard)でプロジェクトを作成
   - プロジェクト設定 > API から以下を取得：
     - Project URL
     - anon public key
     - service_role secret key

2. 環境変数の設定
   - `.env.local`ファイルを編集し、実際の値を設定：
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. 開発サーバーの起動
   ```bash
   yarn dev
   ```

## トラブルシューティング

### よくあるエラー

1. **`supabaseUrl is required`エラー**
   - `.env.local`ファイルが正しく設定されているか確認
   - 開発サーバーを再起動してください

2. **`Missing SUPABASE_SERVICE_ROLE_KEY`エラー**
   - Service Role Keyが正しく設定されているか確認
   - キーが完全にコピーされているか確認

3. **認証エラー**
   - SupabaseプロジェクトでAuthenticationが有効になっているか確認
   - Email認証が有効になっているか確認

## セキュリティ機能

- **APIキー保護**: Service Role Keyはサーバーサイドでのみ使用
- **バリデーション**: クライアント・サーバー両方でバリデーション
- **エラーハンドリング**: 適切なエラーメッセージの表示
- **型安全性**: TypeScriptによる型チェック

## 使用方法

1. ブラウザで `http://localhost:3000` にアクセス
2. 新規登録フォームに必要事項を入力
3. 「新規登録」ボタンをクリック
4. 登録完了後、ホームページにリダイレクト

## 注意事項

- 開発環境では `email_confirm: true` でメール確認をスキップしています
- 本番環境では適切なメール確認設定を行ってください
- Service Role Keyは絶対にクライアントサイドに露出させないでください
