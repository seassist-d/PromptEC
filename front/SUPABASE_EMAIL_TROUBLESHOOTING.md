# Supabase メール送信トラブルシューティング

## 問題
新規登録時にメール認証のメールが送信されない問題が発生しています。

## 確認すべき項目

### 1. 環境変数の設定確認
`.env.local` ファイルに以下の環境変数が正しく設定されているか確認してください：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 2. Supabase ダッシュボードでの設定確認

#### 2.1 Authentication設定
1. Supabase ダッシュボードにログイン
2. プロジェクト選択
3. Authentication > Settings に移動
4. 以下を確認：
   - **Enable email confirmations**: 有効になっているか
   - **Enable email change confirmations**: 有効になっているか
   - **Site URL**: `http://localhost:3000` または本番URLが設定されているか

#### 2.2 Email Templates設定
1. Authentication > Email Templates に移動
2. **Confirm signup** テンプレートを確認
3. 以下が設定されているか確認：
   - **Subject**: メールの件名
   - **Body**: メールの本文（{{ .ConfirmationURL }} が含まれているか）

#### 2.3 SMTP設定
1. Authentication > Settings > SMTP Settings に移動
2. 以下を確認：
   - **Enable custom SMTP**: 有効になっているか
   - **SMTP Host**: 正しく設定されているか
   - **SMTP Port**: 正しく設定されているか
   - **SMTP User**: 正しく設定されているか
   - **SMTP Password**: 正しく設定されているか
   - **SMTP Sender Name**: 送信者名が設定されているか
   - **SMTP Sender Email**: 送信者メールアドレスが設定されているか

### 3. 開発環境での確認

#### 3.1 ローカル開発環境
- `yarn dev` でアプリケーションを起動
- ブラウザの開発者ツールのコンソールでデバッグログを確認
- 以下のログが表示されるか確認：
  ```
  Sending OTP email to: [email]
  Redirect URL: [url]
  OTP response data: [data]
  OTP response error: [error]
  ```

#### 3.2 エラーログの確認
- サーバーサイドのコンソールでエラーログを確認
- ネットワークタブでAPIリクエストの状況を確認

### 4. よくある問題と解決方法

#### 4.1 環境変数が未設定
**症状**: コンソールに「Supabase環境変数が未設定です」エラーが表示される
**解決方法**: `.env.local` ファイルに必要な環境変数を設定

#### 4.2 SMTP設定が無効
**症状**: メール送信は成功するが、実際にメールが届かない
**解決方法**: Supabase ダッシュボードでSMTP設定を有効化

#### 4.3 Site URL設定が間違っている
**症状**: メールは届くが、リンクが正しく動作しない
**解決方法**: Site URLを正しい値に設定

#### 4.4 メールアドレスの形式が間違っている
**症状**: バリデーションエラーが発生する
**解決方法**: 正しいメールアドレス形式で入力

### 5. デバッグ手順

1. **環境変数確認**
   ```bash
   # フロントエンドディレクトリで実行
   cd front
   cat .env.local
   ```

2. **アプリケーション起動**
   ```bash
   yarn dev
   ```

3. **新規登録テスト**
   - ブラウザで `http://localhost:3000/auth/register` にアクセス
   - 有効なメールアドレスを入力
   - 登録ボタンをクリック
   - コンソールログを確認

4. **メール確認**
   - 入力したメールアドレスの受信トレイを確認
   - 迷惑メールフォルダも確認
   - メールが届かない場合は、上記の設定項目を再確認

### 6. 追加の確認事項

- Supabase プロジェクトが有効な状態か
- 使用しているメールアドレスが有効か
- ネットワーク接続が正常か
- ファイアウォールやセキュリティソフトがメール送信をブロックしていないか

## 次のステップ

上記の確認を行っても問題が解決しない場合は、以下を実行してください：

1. コンソールログの内容を確認
2. Supabase ダッシュボードのログを確認
3. エラーメッセージの詳細を確認
4. 必要に応じて、Supabase サポートに問い合わせ
