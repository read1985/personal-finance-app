-- Migration: Fix budget period generation endpoint logic
-- Applied: 2025-07-25
-- Description: Fix budget period generation to stop at reasonable endpoint (3 months) instead of 1 year

-- Fix the budget period generation to stop at a reasonable endpoint
CREATE OR REPLACE FUNCTION generate_budget_periods(p_budget_id UUID, p_end_date DATE DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
  v_budget RECORD;
  v_current_start DATE;
  v_current_end DATE;
  v_final_end_date DATE;
  v_spent_amount BIGINT;
BEGIN
  -- Get budget details
  SELECT * INTO v_budget FROM budgets WHERE id = p_budget_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Budget not found';
  END IF;

  -- Determine the final end date - if no end date provided, generate periods up to 3 months from now
  v_final_end_date := COALESCE(p_end_date, v_budget.end_date, CURRENT_DATE + INTERVAL '3 months');
  
  -- Start from budget start date
  v_current_start := v_budget.start_date;
  
  -- Generate periods until we reach the end date
  WHILE v_current_start <= v_final_end_date LOOP
    -- Calculate period end based on recurrence type
    CASE v_budget.recurrence_type
      WHEN 'daily' THEN
        v_current_end := v_current_start + (v_budget.recurrence_interval - 1) * INTERVAL '1 day';
      WHEN 'weekly' THEN
        v_current_end := v_current_start + (v_budget.recurrence_interval * 7 - 1) * INTERVAL '1 day';
      WHEN 'monthly' THEN
        v_current_end := (v_current_start + v_budget.recurrence_interval * INTERVAL '1 month') - INTERVAL '1 day';
      WHEN 'yearly' THEN
        v_current_end := (v_current_start + v_budget.recurrence_interval * INTERVAL '1 year') - INTERVAL '1 day';
    END CASE;

    -- Don't create periods beyond the final end date
    IF v_current_start > v_final_end_date THEN
      EXIT;
    END IF;

    -- Adjust end date if it goes beyond final end date
    IF v_current_end > v_final_end_date THEN
      v_current_end := v_final_end_date;
    END IF;

    -- Calculate spent amount for this period
    v_spent_amount := calculate_period_spending(p_budget_id, v_current_start, v_current_end);

    -- Insert the period (ignore if already exists)
    INSERT INTO budget_periods (
      budget_id,
      period_start,
      period_end,
      budgeted_amount_cents,
      spent_amount_cents
    ) VALUES (
      p_budget_id,
      v_current_start,
      v_current_end,
      v_budget.amount_cents,
      v_spent_amount
    ) ON CONFLICT (budget_id, period_start) DO UPDATE SET
      spent_amount_cents = v_spent_amount,
      budgeted_amount_cents = v_budget.amount_cents,
      period_end = v_current_end,
      updated_at = now();

    -- Move to next period
    CASE v_budget.recurrence_type
      WHEN 'daily' THEN
        v_current_start := v_current_start + v_budget.recurrence_interval * INTERVAL '1 day';
      WHEN 'weekly' THEN
        v_current_start := v_current_start + v_budget.recurrence_interval * INTERVAL '1 week';
      WHEN 'monthly' THEN
        v_current_start := v_current_start + v_budget.recurrence_interval * INTERVAL '1 month';
      WHEN 'yearly' THEN
        v_current_start := v_current_start + v_budget.recurrence_interval * INTERVAL '1 year';
    END CASE;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;