-- Migration: Fix timezone handling in budget calculations
-- Applied: 2025-07-25
-- Description: Fix budget spending calculations to use Pacific/Auckland timezone for accurate period matching

-- Update the calculate_period_spending function to handle timezones properly
CREATE OR REPLACE FUNCTION calculate_period_spending(
  p_budget_id UUID,
  p_period_start DATE,
  p_period_end DATE
) RETURNS BIGINT AS $$
DECLARE
  v_category_name TEXT;
  v_user_id UUID;
  v_total_spent BIGINT;
BEGIN
  -- Get the category name and user_id for this budget
  SELECT c.name, b.user_id
  INTO v_category_name, v_user_id
  FROM budgets b
  JOIN categories c ON b.category_id = c.id
  WHERE b.id = p_budget_id;

  -- Calculate total spending for this category in the period
  -- Use AT TIME ZONE to convert UTC timestamps to local date comparison
  -- Only count negative amounts (expenses)
  SELECT COALESCE(SUM(ABS(t.amount_cents)), 0)
  INTO v_total_spent
  FROM transactions t
  JOIN accounts a ON t.account_id = a.id
  WHERE t.category = v_category_name
    AND a.owner = v_user_id
    AND t.amount_cents < 0 -- Only expenses
    -- Convert UTC timestamp to Pacific/Auckland timezone then to date for comparison
    AND (t.posted_at AT TIME ZONE 'Pacific/Auckland')::date >= p_period_start
    AND (t.posted_at AT TIME ZONE 'Pacific/Auckland')::date <= p_period_end;

  RETURN v_total_spent;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;