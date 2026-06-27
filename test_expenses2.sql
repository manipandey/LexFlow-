DO $$
DECLARE
  v_firm_id UUID;
  v_case_id UUID;
  v_user_id UUID;
BEGIN
  -- Grab any case that exists
  SELECT id, firm_id INTO v_case_id, v_firm_id FROM cases LIMIT 1;
  
  -- Grab a user from that firm
  SELECT id INTO v_user_id FROM profiles WHERE firm_id = v_firm_id LIMIT 1;

  IF v_case_id IS NOT NULL THEN
    -- Insert a mock invoice (Revenue)
    INSERT INTO invoices (firm_id, case_id, client_id, invoice_number, total_amount, status, due_date)
    VALUES (
      v_firm_id, 
      v_case_id, 
      (SELECT client_id FROM cases WHERE id = v_case_id),
      'INV-TEST-' || extract(epoch from now())::integer, 
      120000.00, 
      'paid', 
      CURRENT_DATE
    );

    -- Insert mock expenses
    INSERT INTO expenses (firm_id, case_id, category, amount, description, logged_by)
    VALUES 
    (v_firm_id, v_case_id, 'filing_fee', 5500.00, 'Initial Court Filing Fee for Supreme Court', v_user_id),
    (v_firm_id, v_case_id, 'travel', 2500.00, 'Flights to Pokhara for deposition', v_user_id),
    (v_firm_id, v_case_id, 'photocopy', 450.00, 'Printed 300 pages of evidence briefs', v_user_id);
    
    RAISE NOTICE 'Mock invoice and expenses inserted for case: %', v_case_id;
  ELSE
    RAISE NOTICE 'No case found to insert test data.';
  END IF;
END $$;
