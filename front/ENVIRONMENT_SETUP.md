# Supabase認証エラーの解決方法

## 現在の状況
環境変数の設定を修正し、開発サーバーを再起動しました。

## 必要な設定

### 1. Supabaseプロジェクトの設定
実際のSupabaseプロジェクトで以下のキーを取得してください：

1. **Supabaseダッシュボードにアクセス**
   - https://supabase.com/dashboard
   - プロジェクトを選択

2. **API設定からキーを取得**
   - プロジェクト設定 > API
   - `Project URL`、`anon public`、`service_role secret`をコピー

### 2. 環境変数の設定
`.env.local`ファイルを以下のように設定：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. 開発サーバーの再起動
```bash
yarn dev
```

## 重要な注意事項

⚠️ **Service Role Keyについて**
- Service Role Keyは**絶対にクライアントサイドに露出させないでください**
- 現在はサンプルキーを使用していますが、実際のプロジェクトでは正しいキーが必要です
- このキーはサーバーサイドでのみ使用され、管理者権限を持ちます

## トラブルシューティング

### よくあるエラー
1. **`Missing NEXT_PUBLIC_SUPABASE_URL`**: 環境変数が設定されていない
2. **`Missing SUPABASE_SERVICE_ROLE_KEY`**: Service Role Keyが設定されていない
3. **認証エラー**: キーが間違っているか、プロジェクトが存在しない

### 解決手順
1. Supabaseダッシュボードでプロジェクトが作成されているか確認
2. API設定から正しいキーをコピー
3. `.env.local`ファイルに正しい値を設定
4. 開発サーバーを再起動

## 次のステップ
環境変数を正しく設定後、新規登録機能が正常に動作するはずです。

