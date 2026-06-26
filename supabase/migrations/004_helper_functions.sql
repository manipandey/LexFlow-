-- ============================================================
-- GENERATE CASE NUMBER
-- ============================================================

CREATE OR REPLACE FUNCTION generate_case_number(p_firm_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_year TEXT;
  v_seq  INTEGER;
  v_slug TEXT;
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COUNT(*) + 1
  INTO v_seq
  FROM cases
  WHERE firm_id = p_firm_id
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
  
  SELECT UPPER(SUBSTRING(slug, 1, 3))
  INTO v_slug
  FROM firms
  WHERE id = p_firm_id;
  
  v_slug := COALESCE(v_slug, 'LXF');
  
  RETURN v_slug || '-' || v_year || '-' || LPAD(v_seq::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- GENERATE INVOICE NUMBER
-- ============================================================

CREATE OR REPLACE FUNCTION generate_invoice_number(p_firm_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_year TEXT;
  v_seq  INTEGER;
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COUNT(*) + 1
  INTO v_seq
  FROM invoices
  WHERE firm_id = p_firm_id
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
  
  RETURN 'INV-' || v_year || '-' || LPAD(v_seq::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- CREATE FIRM FOR OWNER (called from onboarding)
-- ============================================================

CREATE OR REPLACE FUNCTION create_firm_for_owner(
  p_user_id UUID,
  p_firm_name TEXT,
  p_slug TEXT,
  p_email TEXT
)
RETURNS UUID AS $$
DECLARE
  v_firm_id UUID;
BEGIN
  -- Create firm
  INSERT INTO firms (name, slug, email)
  VALUES (p_firm_name, p_slug, p_email)
  RETURNING id INTO v_firm_id;
  
  -- Update user profile with firm_id and firm_owner role
  UPDATE profiles
  SET firm_id = v_firm_id, role = 'firm_owner'
  WHERE id = p_user_id;
  
  -- Create a starter subscription
  INSERT INTO subscriptions (firm_id, plan, status)
  VALUES (v_firm_id, 'starter', 'trialing');
  
  RETURN v_firm_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
