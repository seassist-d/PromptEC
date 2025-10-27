-- 最新の決済レコードを更新してトリガーを発動
UPDATE payments
SET status = 'captured', updated_at = now()
WHERE id = '347a904d-eee9-48b6-bcc2-5789a71e0f0a';

-- 注文のstatusを確認
SELECT id, status, order_number
FROM orders
WHERE id = '77f77c7a-4167-4a73-9ab8-ea765785f8fe';

