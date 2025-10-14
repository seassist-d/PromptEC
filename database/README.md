# Supabase データベースセットアップガイド

## 概要

このディレクトリには、PromptECプロンプト売買ECサイトのSupabaseデータベースを構築するためのSQLファイルが含まれています。

## ファイル構成

```
database/
├── 00_main_execution.sql      # メイン実行ファイル（確認用クエリ含む）
├── 01_enums.sql              # Enum型の定義
├── 02_tables.sql             # テーブルの作成
├── 03_indexes.sql            # インデックスの作成
├── 04_rls_policies.sql       # RLSポリシーの設定
├── 05_functions.sql          # PostgreSQL関数の定義（安全な関数のみ）
├── 06_triggers.sql           # トリガーの設定
├── 07_seed_data.sql          # 初期データの投入
├── 08_japanese_search_optional.sql # 日本語検索の高度な設定（オプション）
├── 09_maintenance_functions.sql # メンテナンス用関数（破壊的操作を含む）
└── README.md                 # このファイル
```

## 実行手順

### 1. Supabaseプロジェクトの準備

1. [Supabase](https://supabase.com)にログイン
2. 新しいプロジェクトを作成
3. プロジェクトのSQL Editorにアクセス

### 2. 既存のuser_profilesテーブルがある場合の対処

**重要**: 既に`front/create_user_profiles_table.sql`でuser_profilesテーブルを作成済みの場合は、以下の手順でクリーンアップしてください：

```sql
-- 1. 既存のテーブルとポリシーを削除
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
DROP FUNCTION IF EXISTS create_profile_for_new_user();
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
```

### 3. SQLファイルの実行

以下の順序でSQLファイルを実行してください：

#### Step 1: Enum型の定義
```sql
-- 01_enums.sql の内容をコピー&ペーストして実行
```

#### Step 2: テーブルの作成
```sql
-- 02_tables.sql の内容をコピー&ペーストして実行
```

#### Step 3: インデックスの作成
```sql
-- 03_indexes.sql の内容をコピー&ペーストして実行
```

#### Step 4: RLSポリシーの設定
```sql
-- 04_rls_policies.sql の内容をコピー&ペーストして実行
```

#### Step 5: PostgreSQL関数の定義
```sql
-- 05_functions.sql の内容をコピー&ペーストして実行
```

#### Step 6: トリガーの設定
```sql
-- 06_triggers.sql の内容をコピー&ペーストして実行
```

#### Step 7: 初期データの投入
```sql
-- 07_seed_data.sql の内容をコピー&ペーストして実行
```

#### Step 8: 日本語検索の高度な設定（オプション）
```sql
-- 08_japanese_search_optional.sql の内容をコピー&ペーストして実行
-- 注意: これはオプションです。より高度な日本語検索が必要な場合のみ実行してください
```

#### Step 9: メンテナンス用関数（オプション・破壊的操作を含む）
```sql
-- 09_maintenance_functions.sql の内容をコピー&ペーストして実行
-- 注意: このファイルには破壊的な操作（DELETE等）が含まれています
-- 実行前にデータのバックアップを取ることを強く推奨します
```

### 3. 実行確認

`00_main_execution.sql` の確認クエリを実行して、各ステップが正常に完了しているか確認してください。

## 主要機能

### 認証・ユーザー管理
- Supabase Authとの連携
- ユーザープロフィール管理
- ロールベースアクセス制御（user/seller/admin）

### プロンプト管理
- プロンプトの作成・編集・削除
- バージョン管理
- カテゴリ・タグ分類
- 全文検索（日本語対応）

### 注文・決済システム
- カート機能
- 注文管理
- 複数決済プロバイダー対応（Stripe/PayPal/PayPay）
- 所有権管理

### 売上管理
- 出品者残高管理
- 売上台帳
- 出金申請
- 手数料計算（80%:20%）

### レビュー・評価
- 星評価システム
- レビュー投稿・管理
- 平均評価計算

### AI SDK統合準備
- AIジョブ管理
- プレビューキャッシュ
- 自動タグ付け
- コンテンツモデレーション

### 管理者機能
- ダッシュボード統計
- ユーザー管理
- プロンプト審査
- 売上レポート

## セキュリティ

### Row Level Security (RLS)
- 全テーブルでRLSを有効化
- ユーザー別アクセス制御
- 管理者権限の適切な分離

### データ保護
- 機密情報の暗号化
- 監査ログの記録
- 個人情報の適切な管理

## パフォーマンス

### インデックス最適化
- 検索用GINインデックス（日本語対応）
- 複合インデックス
- パフォーマンス重視の設計

### キャッシュ戦略
- プレビューキャッシュ
- ランキングスナップショット
- 効率的なデータ取得

## 拡張性

### 将来機能への対応
- サブスクリプション機能
- 多言語対応
- ブロックチェーン統合
- API マーケットプレイス

## トラブルシューティング

### よくある問題

1. **既存のuser_profilesテーブルとの競合**
   - 上記のクリーンアップ手順を実行してから再実行

2. **Enum型の重複エラー**
   - 既存のEnum型を削除してから再実行

3. **外部キー制約エラー**
   - テーブル作成順序を確認

4. **RLSポリシーエラー**
   - 認証状態を確認

5. **関数・トリガーエラー**
   - 依存関係を確認

6. **新規ユーザー登録時のエラー**
   - `create_profile_for_new_user`関数が正常に作成されているか確認

7. **日本語検索設定エラー**
   - `ERROR: text search configuration "japanese" does not exist`が発生した場合
   - `03_indexes.sql`では`simple`設定を使用するように修正済み
   - より高度な日本語検索が必要な場合は`08_japanese_search_optional.sql`を実行

8. **破壊的操作の警告**
   - `05_functions.sql`で「破壊的な操作が含まれています」の警告が表示された場合
   - 破壊的な操作（DELETE等）を含む関数は`09_maintenance_functions.sql`に移動済み
   - `05_functions.sql`は安全な関数のみを含むように修正済み

9. **トリガー確認クエリのエラー**
   - `ERROR: column "schemaname" does not exist`が発生した場合
   - `00_main_execution.sql`のトリガー確認クエリを修正済み
   - PostgreSQLのバージョンに応じた適切なクエリに変更済み

10. **統計情報確認クエリのエラー**
    - `ERROR: column "tablename" does not exist`が発生した場合
    - `pg_stat_user_tables`ビューの`tablename`カラムを`relname`に修正済み
    - PostgreSQLのバージョンに応じた適切なクエリに変更済み

### ログ確認
```sql
-- エラーログの確認
SELECT * FROM pg_stat_activity WHERE state = 'active';
```

## メンテナンス

### 定期メンテナンス
```sql
-- 期限切れデータのクリーンアップ
SELECT cleanup_expired_sessions();

-- 統計情報の更新
ANALYZE;
```

### バックアップ
- Supabaseの自動バックアップを活用
- 重要なデータの手動バックアップ

## サポート

問題が発生した場合は、以下を確認してください：

1. SQLファイルの実行順序
2. Supabaseプロジェクトの設定
3. 認証状態
4. 権限設定

---

**作成日**: 2024年1月15日  
**バージョン**: 1.0  
**対象**: PromptEC v1.0
