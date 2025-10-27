# 管理者アクションテーブル拡張マイグレーション

## 概要

このマイグレーションファイルは、ユーザー管理機能の実装に必要な機能を`admin_actions`テーブルに追加します。

## 対象ファイル

- `add_admin_actions_enhancements.sql`

## 実行内容

### 1. ENUM型の拡張
- `admin_action`型に`role_change`値を追加
- ユーザーのロール変更を記録可能にする

### 2. metadataカラムの追加
- `admin_actions`テーブルに`metadata`カラム（jsonb型）を追加
- 変更前後の値や詳細情報を柔軟に保存可能にする

### 3. インデックスの追加
- `metadata`カラムにGINインデックスを追加
- JSON検索のパフォーマンス向上

## 実行手順

### Supabase SQL Editorで実行

```sql
-- 1. ファイルの内容をコピーしてSQL Editorに貼り付け
-- 2. 実行ボタンをクリック

-- または
-- \i add_admin_actions_enhancements.sql
```

### 確認方法

マイグレーション実行後、以下で確認できます：

```sql
-- ENUM値の確認
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = 'admin_action'::regtype
ORDER BY enumsortorder;

-- 期待される出力:
-- user_ban
-- user_unban
-- prompt_remove
-- review_remove
-- refund
-- other
-- role_change  ← 新しい値

-- カラムの確認
\d admin_actions

-- インデックスの確認
\di idx_admin_actions_metadata
```

## 使用例

### ロール変更の記録

```typescript
// API側の実装例
await supabase.from('admin_actions').insert({
  actor_id: currentAdminUserId,
  action: 'role_change',
  target_type: 'user',
  target_id: targetUserId,
  reason: '売上実績に基づく昇格',
  metadata: {
    from_role: 'user',
    to_role: 'seller'
  }
});
```

### BAN解除の詳細記録

```typescript
await supabase.from('admin_actions').insert({
  actor_id: currentAdminUserId,
  action: 'user_unban',
  target_type: 'user',
  target_id: targetUserId,
  reason: '審査の結果、誤検知と判断',
  metadata: {
    banned_reason: 'スパム行為の疑い',
    investigation_result: 'レビューにより正常なユーザーと判明',
    investigation_date: new Date().toISOString()
  }
});
```

## ロールバック方法

このマイグレーションをロールバックする場合：

```sql
-- metadataカラムを削除（データが失われることに注意）
ALTER TABLE public.admin_actions DROP COLUMN IF EXISTS metadata;

-- インデックスを削除
DROP INDEX IF EXISTS idx_admin_actions_metadata;

-- ENUM型の値は削除できないため、注意が必要
-- 必要に応じて'other'を使用する
```

## 注意事項

1. **ENUM型の値追加は不可逆的**: PostgreSQLのENUM型に追加した値は削除できません
2. **既存データへの影響**: 既存の`admin_actions`レコードには`metadata`カラムが`{}`（空オブジェクト）で追加されます
3. **パフォーマンス**: `metadata`に大量のデータを保存すると、パフォーマンスに影響する可能性があります

## 関連ファイル

- `database/01_enums_fixed.sql` - 元のENUM定義
- `database/02_tables.sql` - 元のテーブル定義
- `database/03_indexes.sql` - インデックス定義
- `front/app/api/admin/users/route.ts` - API実装
- `front/app/admin/users/page.tsx` - UI実装

## トラブルシューティング

### エラー: "enum type already exists"
- ENUM値は既に追加済みです
- マイグレーションは安全に再実行できます（IF NOT EXISTS使用）

### エラー: "column already exists"
- カラムは既に追加済みです
- IF NOT EXISTSを使用しているため、エラーは発生しません

### 確認クエリでエラーが発生する
- テーブルやカラムが存在するか確認してください
- 実行順序を確認してください（01_enums_fixed.sql → 02_tables.sql → このマイグレーション）
