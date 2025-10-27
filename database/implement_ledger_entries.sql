-- Phase 4: 台帳エントリーの完全実装
-- このSQLを実行すると、決済完了時に台帳エントリーも自動作成されるようになります

-- 台帳エントリーも作成するトリガー関数
CREATE OR REPLACE FUNCTION auto_grant_entitlements()
RETURNS trigger 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.status = 'captured' AND (OLD IS NULL OR OLD.status IS NULL OR OLD.status != 'captured') THEN
        -- 1. Entitlementsを作成
        INSERT INTO public.entitlements (buyer_id, order_item_id, prompt_version_id)
        SELECT o.buyer_id, oi.id, oi.prompt_version_id
        FROM public.orders o
        JOIN public.order_items oi ON o.id = oi.order_id
        WHERE o.id = NEW.order_id;
        
        -- 2. 台帳エントリーを作成（計算を整数で行う）
        
        -- 売上計上（+金額）
        INSERT INTO public.ledger_entries (entry_type, order_id, order_item_id, seller_id, amount_jpy, note)
        SELECT 
            'sale_gross'::ledger_entry_type,
            o.id,
            oi.id,
            p.seller_id,
            oi.unit_price_jpy,
            '売上計上'
        FROM public.orders o
        JOIN public.order_items oi ON o.id = oi.order_id
        JOIN public.prompts p ON oi.prompt_id = p.id
        WHERE o.id = NEW.order_id;
        
        -- 決済手数料（3.6%を整数で計算：36/1000）
        INSERT INTO public.ledger_entries (entry_type, order_id, seller_id, amount_jpy, note)
        SELECT 
            'payment_fee'::ledger_entry_type,
            o.id,
            p.seller_id,
            -((oi.unit_price_jpy * 36) / 1000)::bigint,
            '決済手数料'
        FROM public.orders o
        JOIN public.order_items oi ON o.id = oi.order_id
        JOIN public.prompts p ON oi.prompt_id = p.id
        WHERE o.id = NEW.order_id;
        
        -- プラットフォーム手数料（20%を整数で計算）
        INSERT INTO public.ledger_entries (entry_type, order_id, seller_id, amount_jpy, note)
        SELECT 
            'platform_fee'::ledger_entry_type,
            o.id,
            p.seller_id,
            -(oi.unit_price_jpy / 5)::bigint,
            'プラットフォーム手数料'
        FROM public.orders o
        JOIN public.order_items oi ON o.id = oi.order_id
        JOIN public.prompts p ON oi.prompt_id = p.id
        WHERE o.id = NEW.order_id;
        
        -- 出品者純利益（80% - 決済手数料を整数で計算）
        INSERT INTO public.ledger_entries (entry_type, order_id, seller_id, amount_jpy, note)
        SELECT 
            'seller_net'::ledger_entry_type,
            o.id,
            p.seller_id,
            ((oi.unit_price_jpy * 4 / 5) - ((oi.unit_price_jpy * 36) / 1000))::bigint,
            '出品者純利益'
        FROM public.orders o
        JOIN public.order_items oi ON o.id = oi.order_id
        JOIN public.prompts p ON oi.prompt_id = p.id
        WHERE o.id = NEW.order_id;
        
        -- 3. 注文ステータスをpaidに更新
        UPDATE public.orders
        SET status = 'paid'::order_status, updated_at = now()
        WHERE id = NEW.order_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

