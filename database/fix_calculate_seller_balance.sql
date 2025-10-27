-- calculate_seller_balance関数の型エラーを修正
CREATE OR REPLACE FUNCTION calculate_seller_balance(seller_uuid uuid)
RETURNS TABLE(available_jpy bigint, pending_jpy bigint) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (COALESCE(SUM(CASE WHEN entry_type IN ('seller_net', 'adjustment') THEN amount_jpy ELSE 0 END), 0)::bigint - 
        COALESCE(SUM(CASE WHEN entry_type = 'payout' THEN amount_jpy ELSE 0 END), 0)::bigint) as available_jpy,
        COALESCE(SUM(CASE WHEN entry_type = 'seller_net' AND created_at >= CURRENT_DATE - INTERVAL '30 days' THEN amount_jpy ELSE 0 END), 0)::bigint as pending_jpy
    FROM public.ledger_entries
    WHERE seller_id = seller_uuid;
END;
$$ LANGUAGE plpgsql;

