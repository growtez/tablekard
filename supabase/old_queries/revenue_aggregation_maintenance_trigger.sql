CREATE OR REPLACE FUNCTION maintain_revenue_aggregation()
RETURNS TRIGGER AS $$
DECLARE
    order_date DATE;
BEGIN
    -- Handle UPDATE
    IF TG_OP = 'UPDATE' THEN
        -- If order became paid
        IF NEW.payment_status = 'paid' AND OLD.payment_status != 'paid' THEN
            order_date := DATE(NEW.created_at);
            
            INSERT INTO public.revenue (restaurant_id, revenue_date, total_orders, total_revenue, total_tax, total_discount)
            VALUES (NEW.restaurant_id, order_date, 1, NEW.total, NEW.taxes, NEW.discount)
            ON CONFLICT (restaurant_id, revenue_date)
            DO UPDATE SET 
                total_orders = public.revenue.total_orders + 1,
                total_revenue = public.revenue.total_revenue + NEW.total,
                total_tax = public.revenue.total_tax + NEW.taxes,
                total_discount = public.revenue.total_discount + NEW.discount;
                
        -- If order was paid and became unpaid/failed/refunded
        ELSIF OLD.payment_status = 'paid' AND NEW.payment_status != 'paid' THEN
            order_date := DATE(OLD.created_at);
            
            UPDATE public.revenue
            SET total_orders = GREATEST(0, total_orders - 1),
                total_revenue = GREATEST(0::numeric, total_revenue - OLD.total),
                total_tax = GREATEST(0::numeric, total_tax - OLD.taxes),
                total_discount = GREATEST(0::numeric, total_discount - OLD.discount)
            WHERE restaurant_id = OLD.restaurant_id AND revenue_date = order_date;
        END IF;

    -- Handle INSERT
    ELSIF TG_OP = 'INSERT' THEN
        IF NEW.payment_status = 'paid' THEN
            order_date := DATE(NEW.created_at);
            
            INSERT INTO public.revenue (restaurant_id, revenue_date, total_orders, total_revenue, total_tax, total_discount)
            VALUES (NEW.restaurant_id, order_date, 1, NEW.total, NEW.taxes, NEW.discount)
            ON CONFLICT (restaurant_id, revenue_date)
            DO UPDATE SET 
                total_orders = public.revenue.total_orders + 1,
                total_revenue = public.revenue.total_revenue + NEW.total,
                total_tax = public.revenue.total_tax + NEW.taxes,
                total_discount = public.revenue.total_discount + NEW.discount;
        END IF;
        
    -- Handle DELETE (if paid order is deleted)
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.payment_status = 'paid' THEN
            order_date := DATE(OLD.created_at);
            
            UPDATE public.revenue
            SET total_orders = GREATEST(0, total_orders - 1),
                total_revenue = GREATEST(0::numeric, total_revenue - OLD.total),
                total_tax = GREATEST(0::numeric, total_tax - OLD.taxes),
                total_discount = GREATEST(0::numeric, total_discount - OLD.discount)
            WHERE restaurant_id = OLD.restaurant_id AND revenue_date = order_date;
        END IF;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_maintain_revenue ON public.orders;
CREATE TRIGGER trigger_maintain_revenue
    AFTER INSERT OR UPDATE OR DELETE ON public.orders
    FOR EACH ROW EXECUTE PROCEDURE maintain_revenue_aggregation();
