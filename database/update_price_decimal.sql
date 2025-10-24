-- =============================================
-- 価格フィールドを小数点対応に変更するマイグレーション
-- =============================================

-- プロンプトテーブルの価格フィールドをdecimal型に変更
ALTER TABLE public.prompts 
ALTER COLUMN price_jpy TYPE numeric(10,2);

-- 注文アイテムテーブルの価格フィールドをdecimal型に変更
ALTER TABLE public.order_items 
ALTER COLUMN unit_price_jpy TYPE numeric(10,2);

-- カートアイテムテーブルの価格フィールドをdecimal型に変更
ALTER TABLE public.cart_items 
ALTER COLUMN unit_price_jpy TYPE numeric(10,2);

-- レジャーエントリーテーブルの価格フィールドをdecimal型に変更
ALTER TABLE public.ledger_entries 
ALTER COLUMN price_jpy TYPE numeric(10,2);

-- CHECK制約を更新（小数点対応）
ALTER TABLE public.prompts 
DROP CONSTRAINT IF EXISTS prompts_price_jpy_check,
ADD CONSTRAINT prompts_price_jpy_check CHECK (price_jpy >= 0);

ALTER TABLE public.order_items 
DROP CONSTRAINT IF EXISTS order_items_unit_price_jpy_check,
ADD CONSTRAINT order_items_unit_price_jpy_check CHECK (unit_price_jpy >= 0);

ALTER TABLE public.cart_items 
DROP CONSTRAINT IF EXISTS cart_items_unit_price_jpy_check,
ADD CONSTRAINT cart_items_unit_price_jpy_check CHECK (unit_price_jpy >= 0);

ALTER TABLE public.ledger_entries 
DROP CONSTRAINT IF EXISTS ledger_entries_price_jpy_check,
ADD CONSTRAINT ledger_entries_price_jpy_check CHECK (price_jpy >= 0);
