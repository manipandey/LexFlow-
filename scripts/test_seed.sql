-- Test seed for QA suite
INSERT INTO firms (id, name, slug) VALUES (gen_random_uuid(), 'Test Firm', 'test-firm');
INSERT INTO clients (id, firm_id, full_name) VALUES (gen_random_uuid(), (SELECT id FROM firms WHERE slug='test-firm'), 'Test Client');
INSERT INTO profiles (id, full_name, firm_id) VALUES (gen_random_uuid(), 'Test Lawyer', (SELECT id FROM firms WHERE slug='test-firm'));
INSERT INTO cases (id, firm_id, client_id, title, case_number, status) VALUES (gen_random_uuid(), (SELECT id FROM firms WHERE slug='test-firm'), (SELECT id FROM clients LIMIT 1), 'Sample Case', 'CASE-001', 'open');
INSERT INTO expenses (id, firm_id, case_id, category, amount, expense_date, logged_by) VALUES (gen_random_uuid(), (SELECT id FROM firms WHERE slug='test-firm'), (SELECT id FROM cases LIMIT 1), 'travel', 100, CURRENT_DATE, (SELECT id FROM profiles LIMIT 1));
INSERT INTO invoices (id, firm_id, case_id, total_amount, status) VALUES (gen_random_uuid(), (SELECT id FROM firms WHERE slug='test-firm'), (SELECT id FROM cases LIMIT 1), 1500, 'paid');
