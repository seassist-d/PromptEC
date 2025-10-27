-- トリガーの状態を確認
SELECT 
    tgname AS trigger_name,
    tgtype::text AS trigger_type,
    tgenabled AS enabled
FROM pg_trigger
WHERE tgname = 'trigger_auto_grant_entitlements';

-- トリガー関数の定義を確認
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'auto_grant_entitlements';

-- 最近の決済レコードを確認
SELECT 
    id,
    order_id,
    status,
    created_at,
    updated_at
FROM payments
ORDER BY created_at DESC
LIMIT 5;

-- 対応する注文のステータスを確認
SELECT 
    o.id,
    o.status,
    o.created_at,
    p.id AS payment_id,
    p.status AS payment_status,
    p.created_at AS payment_created_at
FROM orders o
LEFT JOIN payments p ON o.id = p.order_id
ORDER BY o.created_at DESC
LIMIT 5;

