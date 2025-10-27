-- 最新の決済レコードのstatusを確認
SELECT 
    id,
    order_id,
    status,
    created_at,
    updated_at,
    raw_payload::json->>'note' AS note
FROM payments
ORDER BY created_at DESC
LIMIT 10;

