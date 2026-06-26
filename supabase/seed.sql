-- ============================================================
-- LexFlow - Seed Data for Development (Nepali Context)
-- ============================================================
-- Run AFTER migrations 001, 002, 003
-- This creates demo data for a single test firm.
-- IMPORTANT: Create users via Supabase Auth first, then update UUIDs below.
-- ============================================================

-- Disable RLS for seeding
SET session_replication_role = replica;

-- ============================================================
-- FIRM
-- ============================================================

INSERT INTO firms (id, name, slug, email, phone, address, city, state, country, postal_code, website, timezone)
VALUES (
  'f1000000-0000-0000-0000-000000000001',
  'Himalayan Legal Associates',
  'himalayan-legal',
  'info@himalayanlegal.com.np',
  '+977-1-4220001',
  '123 Nyaya Marg, Babarmahal',
  'Kathmandu',
  'Bagmati',
  'NP',
  '44600',
  'https://himalayanlegal.com.np',
  'Asia/Kathmandu'
);

-- ============================================================
-- SUBSCRIPTION
-- ============================================================

INSERT INTO subscriptions (firm_id, plan, status, max_team_members, max_clients, trial_ends_at)
VALUES (
  'f1000000-0000-0000-0000-000000000001',
  'professional',
  'active',
  15,
  NULL,
  NOW() + INTERVAL '30 days'
);

-- ============================================================
-- PROFILES (create auth users first via Supabase dashboard, then insert profiles)
-- Profile IDs must match auth.users IDs
-- ============================================================

-- Firm Owner
INSERT INTO profiles (id, firm_id, role, full_name, phone, title)
VALUES (
  'd1000000-0000-0000-0000-000000000001',
  'f1000000-0000-0000-0000-000000000001',
  'firm_owner',
  'Ram Sharma',
  '+977-9841000001',
  'Managing Partner / Senior Advocate'
);

-- Senior Lawyer
INSERT INTO profiles (id, firm_id, role, full_name, phone, title)
VALUES (
  'd1000000-0000-0000-0000-000000000002',
  'f1000000-0000-0000-0000-000000000001',
  'senior_lawyer',
  'Sita Thapa',
  '+977-9841000002',
  'Senior Advocate'
);

-- Lawyer
INSERT INTO profiles (id, firm_id, role, full_name, phone, title)
VALUES (
  'd1000000-0000-0000-0000-000000000003',
  'f1000000-0000-0000-0000-000000000001',
  'lawyer',
  'Hari Khadka',
  '+977-9841000003',
  'Advocate'
);

-- Paralegal
INSERT INTO profiles (id, firm_id, role, full_name, phone, title)
VALUES (
  'd1000000-0000-0000-0000-000000000004',
  'f1000000-0000-0000-0000-000000000001',
  'paralegal',
  'Gita Adhikari',
  '+977-9841000004',
  'Legal Assistant / Pleader'
);

-- Client
INSERT INTO profiles (id, firm_id, role, full_name, phone, title)
VALUES (
  'd1000000-0000-0000-0000-000000000005',
  'f1000000-0000-0000-0000-000000000001',
  'client',
  'Shyam Shrestha',
  '+977-9841000005',
  NULL
);

-- ============================================================
-- CLIENTS
-- ============================================================

INSERT INTO clients (id, firm_id, profile_id, full_name, email, phone, address, city, state, country, company_name, tags, created_by)
VALUES
(
  'c1000000-0000-0000-0000-000000000001',
  'f1000000-0000-0000-0000-000000000001',
  'd1000000-0000-0000-0000-000000000005',
  'Shyam Shrestha',
  'shyam.shrestha@example.com',
  '+977-9851000200',
  '456 Durbar Marg',
  'Kathmandu',
  'Bagmati',
  'NP',
  'Shrestha Trading Pvt. Ltd.',
  ARRAY['corporate', 'vip'],
  'd1000000-0000-0000-0000-000000000001'
),
(
  'c1000000-0000-0000-0000-000000000002',
  'f1000000-0000-0000-0000-000000000001',
  NULL,
  'Nita Maharjan',
  'nita.maharjan@example.com',
  '+977-9851000201',
  '789 Pulchowk',
  'Lalitpur',
  'Bagmati',
  'NP',
  NULL,
  ARRAY['family', 'active'],
  'd1000000-0000-0000-0000-000000000002'
),
(
  'c1000000-0000-0000-0000-000000000003',
  'f1000000-0000-0000-0000-000000000001',
  NULL,
  'Gopal KC',
  'gopal.kc@example.com',
  '+977-9851000202',
  '321 Lakeside',
  'Pokhara',
  'Gandaki',
  'NP',
  'Gandaki Hydropower',
  ARRAY['corporate', 'active'],
  'd1000000-0000-0000-0000-000000000001'
),
(
  'c1000000-0000-0000-0000-000000000004',
  'f1000000-0000-0000-0000-000000000001',
  NULL,
  'Pema Sherpa',
  'pema.sherpa@example.com',
  '+977-9851000203',
  '654 Boudha',
  'Kathmandu',
  'Bagmati',
  'NP',
  NULL,
  ARRAY['immigration'],
  'd1000000-0000-0000-0000-000000000003'
),
(
  'c1000000-0000-0000-0000-000000000005',
  'f1000000-0000-0000-0000-000000000001',
  NULL,
  'Dipak Magar',
  'dipak.magar@example.com',
  '+977-9851000204',
  '987 New Road',
  'Kathmandu',
  'Bagmati',
  'NP',
  NULL,
  ARRAY['criminal', 'urgent'],
  'd1000000-0000-0000-0000-000000000002'
);

-- ============================================================
-- CASES
-- ============================================================

INSERT INTO cases (id, firm_id, case_number, title, case_type, description, client_id, assigned_lawyer_id, priority, status, court_name, filing_date, created_by)
VALUES
(
  'ca000000-0000-0000-0000-000000000001',
  'f1000000-0000-0000-0000-000000000001',
  'CASE-081-0001',
  'Shrestha Trading v. Apex Corporation - Contract Dispute',
  'corporate',
  'Breach of contract claim involving Rs. 2.5 Crore technology services agreement between Shrestha Trading and Apex Corporation.',
  'c1000000-0000-0000-0000-000000000001',
  'd1000000-0000-0000-0000-000000000002',
  'high',
  'in_progress',
  'High Court Patan',
  '2024-03-15',
  'd1000000-0000-0000-0000-000000000001'
),
(
  'ca000000-0000-0000-0000-000000000002',
  'f1000000-0000-0000-0000-000000000001',
  'CASE-081-0002',
  'Maharjan Divorce Proceedings',
  'family',
  'Dissolution of marriage including asset division (Aansabanda), child custody, and support arrangements.',
  'c1000000-0000-0000-0000-000000000002',
  'd1000000-0000-0000-0000-000000000002',
  'medium',
  'hearing_scheduled',
  'Kathmandu District Court',
  '2024-04-02',
  'd1000000-0000-0000-0000-000000000002'
),
(
  'ca000000-0000-0000-0000-000000000003',
  'f1000000-0000-0000-0000-000000000001',
  'CASE-081-0003',
  'Gandaki Hydropower - Employment Dispute',
  'employment',
  'Wrongful termination claim filed by former Operations Manager against Gandaki Hydropower at the Labor Court.',
  'c1000000-0000-0000-0000-000000000003',
  'd1000000-0000-0000-0000-000000000003',
  'medium',
  'filed',
  'Labor Court Kathmandu',
  '2024-04-20',
  'd1000000-0000-0000-0000-000000000001'
),
(
  'ca000000-0000-0000-0000-000000000004',
  'f1000000-0000-0000-0000-000000000001',
  'CASE-081-0004',
  'Sherpa Visa Processing',
  'immigration',
  'US Visa application documentation and legal advice.',
  'c1000000-0000-0000-0000-000000000004',
  'd1000000-0000-0000-0000-000000000003',
  'low',
  'under_review',
  'Department of Immigration',
  '2024-05-01',
  'd1000000-0000-0000-0000-000000000003'
),
(
  'ca000000-0000-0000-0000-000000000005',
  'f1000000-0000-0000-0000-000000000001',
  'CASE-081-0018',
  'State vs. Magar',
  'criminal',
  'Defense against assault charges. Client maintains innocence with credible alibi.',
  'c1000000-0000-0000-0000-000000000005',
  'd1000000-0000-0000-0000-000000000002',
  'urgent',
  'open',
  'Kathmandu District Court',
  '2024-05-10',
  'd1000000-0000-0000-0000-000000000002'
);

-- ============================================================
-- HEARINGS
-- ============================================================

INSERT INTO hearings (firm_id, case_id, client_id, assigned_lawyer_id, title, hearing_type, court_name, hearing_date, start_time, end_time, notes, created_by)
VALUES
(
  'f1000000-0000-0000-0000-000000000001',
  'ca000000-0000-0000-0000-000000000001',
  'c1000000-0000-0000-0000-000000000001',
  'd1000000-0000-0000-0000-000000000002',
  'Initial Hearing - Shrestha Trading',
  'hearing',
  'High Court Patan',
  CURRENT_DATE + 3,
  '10:30',
  '11:30',
  'Bring all contract documentation and correspondence.',
  'd1000000-0000-0000-0000-000000000002'
),
(
  'f1000000-0000-0000-0000-000000000002',
  'ca000000-0000-0000-0000-000000000002',
  'c1000000-0000-0000-0000-000000000002',
  'd1000000-0000-0000-0000-000000000002',
  'Aansabanda Hearing - Maharjan',
  'hearing',
  'Kathmandu District Court',
  CURRENT_DATE + 7,
  '14:00',
  '16:00',
  'Settlement conference scheduled. Prepare property valuation report.',
  'd1000000-0000-0000-0000-000000000002'
),
(
  'f1000000-0000-0000-0000-000000000001',
  'ca000000-0000-0000-0000-000000000005',
  'c1000000-0000-0000-0000-000000000005',
  'd1000000-0000-0000-0000-000000000002',
  'Bail Hearing (Thunchek) - Magar',
  'hearing',
  'Kathmandu District Court',
  CURRENT_DATE + 14,
  '11:00',
  '12:00',
  'Initial appearance for bail argument.',
  'd1000000-0000-0000-0000-000000000002'
),
(
  'f1000000-0000-0000-0000-000000000001',
  NULL,
  'c1000000-0000-0000-0000-000000000004',
  'd1000000-0000-0000-0000-000000000003',
  'Client Consultation - Pema Sherpa',
  'consultation',
  NULL,
  CURRENT_DATE + 2,
  '15:00',
  '16:00',
  'Review additional documentation for visa petition.',
  'd1000000-0000-0000-0000-000000000003'
);

-- ============================================================
-- TASKS
-- ============================================================

INSERT INTO tasks (firm_id, case_id, title, description, assigned_to, created_by, priority, status, due_date)
VALUES
(
  'f1000000-0000-0000-0000-000000000001',
  'ca000000-0000-0000-0000-000000000001',
  'Prepare contract analysis memo',
  'Analyze the technology services agreement and identify breach points.',
  'd1000000-0000-0000-0000-000000000002',
  'd1000000-0000-0000-0000-000000000001',
  'high',
  'in_progress',
  CURRENT_DATE + 5
),
(
  'f1000000-0000-0000-0000-000000000001',
  'ca000000-0000-0000-0000-000000000002',
  'Draft Aansabanda proposal',
  'Create comprehensive property division plan.',
  'd1000000-0000-0000-0000-000000000004',
  'd1000000-0000-0000-0000-000000000002',
  'medium',
  'pending',
  CURRENT_DATE + 6
),
(
  'f1000000-0000-0000-0000-000000000001',
  'ca000000-0000-0000-0000-000000000004',
  'Compile supporting documents',
  'Gather all required forms and NOC letters.',
  'd1000000-0000-0000-0000-000000000004',
  'd1000000-0000-0000-0000-000000000003',
  'medium',
  'in_progress',
  CURRENT_DATE + 10
),
(
  'f1000000-0000-0000-0000-000000000001',
  'ca000000-0000-0000-0000-000000000005',
  'Interview alibi witnesses',
  'Contact and interview 3 potential alibi witnesses. Document statements.',
  'd1000000-0000-0000-0000-000000000003',
  'd1000000-0000-0000-0000-000000000002',
  'urgent',
  'pending',
  CURRENT_DATE + 12
),
(
  'f1000000-0000-0000-0000-000000000001',
  NULL,
  'Update firm contact information on website',
  'Update the new office phone number and address on the firm website.',
  'd1000000-0000-0000-0000-000000000004',
  'd1000000-0000-0000-0000-000000000001',
  'low',
  'pending',
  CURRENT_DATE + 20
);

-- ============================================================
-- INVOICES
-- ============================================================

INSERT INTO invoices (id, firm_id, client_id, case_id, invoice_number, status, issue_date, due_date, subtotal, tax_rate, tax_amount, total_amount, paid_amount, currency, created_by)
VALUES
(
  'b1000000-0000-0000-0000-000000000001',
  'f1000000-0000-0000-0000-000000000001',
  'c1000000-0000-0000-0000-000000000001',
  'ca000000-0000-0000-0000-000000000001',
  'INV-081-0001',
  'paid',
  CURRENT_DATE - 30,
  CURRENT_DATE - 15,
  50000.00,
  13.00,
  6500.00,
  56500.00,
  56500.00,
  'NPR',
  'd1000000-0000-0000-0000-000000000001'
),
(
  'b1000000-0000-0000-0000-000000000002',
  'f1000000-0000-0000-0000-000000000001',
  'c1000000-0000-0000-0000-000000000001',
  'ca000000-0000-0000-0000-000000000001',
  'INV-081-0002',
  'sent',
  CURRENT_DATE - 5,
  CURRENT_DATE + 25,
  75000.00,
  13.00,
  9750.00,
  84750.00,
  0.00,
  'NPR',
  'd1000000-0000-0000-0000-000000000001'
),
(
  'b1000000-0000-0000-0000-000000000003',
  'f1000000-0000-0000-0000-000000000001',
  'c1000000-0000-0000-0000-000000000002',
  'ca000000-0000-0000-0000-000000000002',
  'INV-081-0003',
  'overdue',
  CURRENT_DATE - 45,
  CURRENT_DATE - 15,
  35000.00,
  13.00,
  4550.00,
  39550.00,
  0.00,
  'NPR',
  'd1000000-0000-0000-0000-000000000002'
),
(
  'b1000000-0000-0000-0000-000000000004',
  'f1000000-0000-0000-0000-000000000001',
  'c1000000-0000-0000-0000-000000000003',
  'ca000000-0000-0000-0000-000000000003',
  'INV-081-0004',
  'draft',
  CURRENT_DATE,
  CURRENT_DATE + 30,
  42000.00,
  13.00,
  5460.00,
  47460.00,
  0.00,
  'NPR',
  'd1000000-0000-0000-0000-000000000001'
);

-- Invoice line items
INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, amount, sort_order)
VALUES
('b1000000-0000-0000-0000-000000000001', 'Legal Consultation (10 hrs)', 10, 3500.00, 35000.00, 1),
('b1000000-0000-0000-0000-000000000001', 'Document Preparation', 1, 15000.00, 15000.00, 2),
('b1000000-0000-0000-0000-000000000002', 'Court Representation (15 hrs)', 15, 4000.00, 60000.00, 1),
('b1000000-0000-0000-0000-000000000002', 'Filing Fees', 1, 7500.00, 7500.00, 2),
('b1000000-0000-0000-0000-000000000002', 'Administrative Costs', 1, 7500.00, 7500.00, 3),
('b1000000-0000-0000-0000-000000000003', 'Family Law Consultation (8 hrs)', 8, 3000.00, 24000.00, 1),
('b1000000-0000-0000-0000-000000000003', 'Mediation Session', 1, 11000.00, 11000.00, 2),
('b1000000-0000-0000-0000-000000000004', 'Employment Law Review (12 hrs)', 12, 3500.00, 42000.00, 1);

-- ============================================================
-- CASE UPDATES (timeline entries)
-- ============================================================

INSERT INTO case_updates (firm_id, case_id, author_id, update_type, title, content, old_value, new_value)
VALUES
(
  'f1000000-0000-0000-0000-000000000001',
  'ca000000-0000-0000-0000-000000000001',
  'd1000000-0000-0000-0000-000000000002',
  'note',
  'Initial Assessment Complete',
  'Completed initial review of contract documentation. Strong breach of contract case based on Section 4.2 violations.',
  NULL,
  NULL
),
(
  'f1000000-0000-0000-0000-000000000001',
  'ca000000-0000-0000-0000-000000000001',
  'd1000000-0000-0000-0000-000000000002',
  'status_change',
  'Status Updated',
  'Case status changed from open to in_progress',
  'open',
  'in_progress'
),
(
  'f1000000-0000-0000-0000-000000000001',
  'ca000000-0000-0000-0000-000000000002',
  'd1000000-0000-0000-0000-000000000002',
  'note',
  'Settlement Offer Received',
  'Opposing counsel submitted initial settlement offer. Currently under review. Client notified.',
  NULL,
  NULL
),
(
  'f1000000-0000-0000-0000-000000000001',
  'ca000000-0000-0000-0000-000000000005',
  'd1000000-0000-0000-0000-000000000002',
  'note',
  'Case File Opened',
  'Emergency consultation completed. Client maintains innocence. Identified 3 potential alibi witnesses. Bail hearing scheduled.',
  NULL,
  NULL
);

-- Re-enable RLS
SET session_replication_role = DEFAULT;
