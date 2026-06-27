-- ============================================================================
-- LexFlow - Law Firm Management System
-- Combined Migration: Schema, Policies, Triggers & Helpers
-- Copy and paste this ENTIRE script into the Supabase SQL Editor and click RUN
-- ============================================================================

-- ============================================================
-- 1. SCHEMAS & TABLES (From Migration 001)
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ENUMS
CREATE TYPE user_role AS ENUM (
  'firm_owner',
  'senior_lawyer',
  'lawyer',
  'paralegal',
  'receptionist',
  'client'
);

CREATE TYPE subscription_plan AS ENUM (
  'starter',
  'professional',
  'enterprise'
);

CREATE TYPE subscription_status AS ENUM (
  'active',
  'trialing',
  'past_due',
  'canceled',
  'unpaid'
);

CREATE TYPE case_status AS ENUM (
  'open',
  'under_review',
  'filed',
  'hearing_scheduled',
  'in_progress',
  'awaiting_decision',
  'closed'
);

CREATE TYPE case_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

CREATE TYPE case_type AS ENUM (
  'civil',
  'criminal',
  'family',
  'corporate',
  'intellectual_property',
  'real_estate',
  'immigration',
  'employment',
  'tax',
  'constitutional',
  'other'
);

CREATE TYPE task_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'overdue'
);

CREATE TYPE task_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

CREATE TYPE document_category AS ENUM (
  'contracts',
  'court_documents',
  'agreements',
  'evidence',
  'legal_notices',
  'client_ids',
  'other'
);
  
CREATE TYPE invoice_status AS ENUM (
  'draft',
  'sent',
  'paid',
  'overdue',
  'canceled'
);

CREATE TYPE notification_type AS ENUM (
  'hearing_reminder',
  'task_deadline',
  'new_client',
  'new_document',
  'invoice_due',
  'case_update',
  'system'
);

CREATE TYPE activity_action AS ENUM (
  'login',
  'logout',
  'create',
  'update',
  'delete',
  'upload',
  'download',
  'invite',
  'view'
);

-- TABLE: firms
CREATE TABLE firms (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  logo_url        TEXT,
  address         TEXT,
  city            TEXT,
  state           TEXT,
  country         TEXT DEFAULT 'US',
  postal_code     TEXT,
  phone           TEXT,
  email           TEXT,
  website         TEXT,
  tax_id          TEXT,
  timezone        TEXT DEFAULT 'UTC',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_firms_slug ON firms(slug);

-- TABLE: subscriptions
CREATE TABLE subscriptions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id           UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  plan              subscription_plan NOT NULL DEFAULT 'starter',
  status            subscription_status NOT NULL DEFAULT 'trialing',
  max_team_members  INT NOT NULL DEFAULT 3,
  max_clients       INT,          -- NULL = unlimited
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  trial_ends_at        TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  stripe_customer_id   TEXT,
  stripe_subscription_id TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(firm_id)
);

CREATE INDEX idx_subscriptions_firm_id ON subscriptions(firm_id);

-- TABLE: profiles
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  firm_id         UUID REFERENCES firms(id) ON DELETE SET NULL,
  role            user_role NOT NULL DEFAULT 'client',
  full_name       TEXT NOT NULL,
  avatar_url      TEXT,
  phone           TEXT,
  title           TEXT,           -- e.g. "Senior Attorney"
  bio             TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_seen_at    TIMESTAMPTZ,
  invited_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_firm_id ON profiles(firm_id);
CREATE INDEX idx_profiles_role ON profiles(firm_id, role);

-- TABLE: clients
CREATE TABLE clients (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id         UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  profile_id      UUID REFERENCES profiles(id) ON DELETE SET NULL, -- if client has portal login
  full_name       TEXT NOT NULL,
  email           TEXT,
  phone           TEXT,
  address         TEXT,
  city            TEXT,
  state           TEXT,
  country         TEXT,
  postal_code     TEXT,
  company_name    TEXT,
  id_type         TEXT,           -- Passport, National ID, etc.
  id_number       TEXT,           -- Citizenship/Passport number
  notes           TEXT,
  tags            TEXT[] DEFAULT '{}',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clients_firm_id ON clients(firm_id);
CREATE INDEX idx_clients_full_name ON clients USING gin(to_tsvector('english', full_name));
CREATE INDEX idx_clients_email ON clients(firm_id, email);
CREATE INDEX idx_clients_tags ON clients USING gin(tags);

-- TABLE: cases
CREATE TABLE cases (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id           UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  case_number       TEXT NOT NULL,
  title             TEXT NOT NULL,
  case_type         case_type NOT NULL DEFAULT 'other',
  description       TEXT,
  client_id         UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  assigned_lawyer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  priority          case_priority NOT NULL DEFAULT 'medium',
  status            case_status NOT NULL DEFAULT 'open',
  court_name        TEXT,
  filing_date       DATE,
  closing_date      DATE,
  estimated_value   NUMERIC(12,2),
  notes             TEXT,
  created_by        UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(firm_id, case_number)
);

CREATE INDEX idx_cases_firm_id ON cases(firm_id);
CREATE INDEX idx_cases_client_id ON cases(client_id);
CREATE INDEX idx_cases_status ON cases(firm_id, status);
CREATE INDEX idx_cases_assigned_lawyer ON cases(assigned_lawyer_id);
CREATE INDEX idx_cases_title ON cases USING gin(to_tsvector('english', title));

-- TABLE: case_team_members
CREATE TABLE case_team_members (
  case_id         UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_on_case    TEXT,
  added_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (case_id, profile_id)
);

CREATE INDEX idx_case_team_case_id ON case_team_members(case_id);
CREATE INDEX idx_case_team_profile_id ON case_team_members(profile_id);

-- TABLE: case_updates
CREATE TABLE case_updates (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id         UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  case_id         UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  author_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  update_type     TEXT NOT NULL DEFAULT 'note', -- note | status_change | document | hearing
  title           TEXT,
  content         TEXT NOT NULL,
  old_value       TEXT,
  new_value       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_case_updates_case_id ON case_updates(case_id);
CREATE INDEX idx_case_updates_firm_id ON case_updates(firm_id);

-- TABLE: hearings
CREATE TABLE hearings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id         UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  case_id         UUID REFERENCES cases(id) ON DELETE SET NULL,
  client_id       UUID REFERENCES clients(id) ON DELETE SET NULL,
  assigned_lawyer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  hearing_type    TEXT NOT NULL DEFAULT 'hearing',
  court_name      TEXT,
  location        TEXT,
  hearing_date    DATE NOT NULL,
  start_time      TIME,
  end_time        TIME,
  notes           TEXT,
  is_completed    BOOLEAN NOT NULL DEFAULT FALSE,
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_hearings_firm_id ON hearings(firm_id);
CREATE INDEX idx_hearings_date ON hearings(firm_id, hearing_date);
CREATE INDEX idx_hearings_case_id ON hearings(case_id);
CREATE INDEX idx_hearings_lawyer ON hearings(assigned_lawyer_id);

-- TABLE: documents
CREATE TABLE documents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id         UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  case_id         UUID REFERENCES cases(id) ON DELETE SET NULL,
  client_id       UUID REFERENCES clients(id) ON DELETE SET NULL,
  uploaded_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  original_name   TEXT NOT NULL,
  file_path       TEXT NOT NULL,
  file_size       BIGINT,
  mime_type       TEXT,
  category        document_category NOT NULL DEFAULT 'other',
  description     TEXT,
  is_shared_with_client BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_documents_firm_id ON documents(firm_id);
CREATE INDEX idx_documents_case_id ON documents(case_id);
CREATE INDEX idx_documents_client_id ON documents(client_id);
CREATE INDEX idx_documents_category ON documents(firm_id, category);

-- TABLE: tasks
CREATE TABLE tasks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id         UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  case_id         UUID REFERENCES cases(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  assigned_to     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_by      UUID REFERENCES profiles(id),
  priority        task_priority NOT NULL DEFAULT 'medium',
  status          task_status NOT NULL DEFAULT 'pending',
  due_date        DATE,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_firm_id ON tasks(firm_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_case_id ON tasks(case_id);
CREATE INDEX idx_tasks_status ON tasks(firm_id, status);
CREATE INDEX idx_tasks_due_date ON tasks(firm_id, due_date);

-- TABLE: invoices
CREATE TABLE invoices (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id         UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  case_id         UUID REFERENCES cases(id) ON DELETE SET NULL,
  invoice_number  TEXT NOT NULL,
  status          invoice_status NOT NULL DEFAULT 'draft',
  issue_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date        DATE,
  subtotal        NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_rate        NUMERIC(5,2) NOT NULL DEFAULT 0,
  tax_amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount    NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_amount     NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency        TEXT NOT NULL DEFAULT 'USD',
  notes           TEXT,
  payment_date    DATE,
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(firm_id, invoice_number)
);

CREATE INDEX idx_invoices_firm_id ON invoices(firm_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(firm_id, status);
CREATE INDEX idx_invoices_due_date ON invoices(firm_id, due_date);

-- TABLE: invoice_items
CREATE TABLE invoice_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id      UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description     TEXT NOT NULL,
  quantity        NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price      NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- TABLE: notifications
CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id         UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  recipient_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type            notification_type NOT NULL DEFAULT 'system',
  title           TEXT NOT NULL,
  message         TEXT,
  link            TEXT,
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  read_at         TIMESTAMPTZ,
  related_id      UUID,
  related_type    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, is_read);
CREATE INDEX idx_notifications_firm_id ON notifications(firm_id);
CREATE INDEX idx_notifications_created ON notifications(recipient_id, created_at DESC);

-- TABLE: activity_logs
CREATE TABLE activity_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id         UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action          activity_action NOT NULL,
  entity_type     TEXT NOT NULL,
  entity_id       UUID,
  entity_name     TEXT,
  description     TEXT,
  metadata        JSONB DEFAULT '{}',
  ip_address      INET,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_firm_id ON activity_logs(firm_id, created_at DESC);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);

-- TABLE: messages
CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id         UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  case_id         UUID REFERENCES cases(id) ON DELETE SET NULL,
  sender_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_firm_id ON messages(firm_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id, is_read);
CREATE INDEX idx_messages_case_id ON messages(case_id);


-- ============================================================
-- 2. ENABLE ROW LEVEL SECURITY (From Migration 002)
-- ============================================================

ALTER TABLE firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE hearings ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 3. HELPER FUNCTIONS FOR SECURITY (From Migration 002)
-- ============================================================

CREATE OR REPLACE FUNCTION public.firm_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT firm_id FROM profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.user_role()
RETURNS user_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.is_firm_owner()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role = 'firm_owner' FROM profiles WHERE id = auth.uid()
$$;


-- ============================================================
-- 4. RLS POLICIES (From Migration 002)
-- ============================================================

-- firms
CREATE POLICY "firms_select_staff" ON firms FOR SELECT USING (id = public.firm_id());
CREATE POLICY "firms_update_owner" ON firms FOR UPDATE USING (id = public.firm_id() AND public.is_firm_owner());
CREATE POLICY "firms_insert_service" ON firms FOR INSERT WITH CHECK (TRUE);

-- subscriptions
CREATE POLICY "subscriptions_select_staff" ON subscriptions FOR SELECT USING (firm_id = public.firm_id());
CREATE POLICY "subscriptions_update_owner" ON subscriptions FOR UPDATE USING (firm_id = public.firm_id() AND public.is_firm_owner());
CREATE POLICY "subscriptions_insert_service" ON subscriptions FOR INSERT WITH CHECK (TRUE);

-- profiles
CREATE POLICY "profiles_select_same_firm" ON profiles FOR SELECT USING (firm_id = public.firm_id() OR id = auth.uid());
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles_update_admin" ON profiles FOR UPDATE USING (firm_id = public.firm_id() AND public.is_firm_admin());
CREATE POLICY "profiles_insert_service" ON profiles FOR INSERT WITH CHECK (TRUE);

-- clients
CREATE POLICY "clients_select_staff" ON clients FOR SELECT USING (firm_id = public.firm_id() AND public.is_firm_staff());
CREATE POLICY "clients_select_own" ON clients FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "clients_insert_staff" ON clients FOR INSERT WITH CHECK (firm_id = public.firm_id() AND public.is_firm_staff());
CREATE POLICY "clients_update_staff" ON clients FOR UPDATE USING (firm_id = public.firm_id() AND public.is_firm_staff());
CREATE POLICY "clients_delete_admin" ON clients FOR DELETE USING (firm_id = public.firm_id() AND public.is_firm_admin());

-- cases
CREATE POLICY "cases_select_staff" ON cases FOR SELECT USING (firm_id = public.firm_id() AND public.is_firm_staff());
CREATE POLICY "cases_select_client" ON cases FOR SELECT USING (client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid()));
CREATE POLICY "cases_insert_staff" ON cases FOR INSERT WITH CHECK (firm_id = public.firm_id() AND public.is_firm_staff());
CREATE POLICY "cases_update_staff" ON cases FOR UPDATE USING (firm_id = public.firm_id() AND public.is_firm_staff());
CREATE POLICY "cases_delete_admin" ON cases FOR DELETE USING (firm_id = public.firm_id() AND public.is_firm_admin());

-- case_team_members
CREATE POLICY "case_team_select_staff" ON case_team_members FOR SELECT USING (case_id IN (SELECT id FROM cases WHERE firm_id = public.firm_id()));
CREATE POLICY "case_team_insert_admin" ON case_team_members FOR INSERT WITH CHECK (case_id IN (SELECT id FROM cases WHERE firm_id = public.firm_id()) AND public.is_firm_staff());
CREATE POLICY "case_team_delete_admin" ON case_team_members FOR DELETE USING (case_id IN (SELECT id FROM cases WHERE firm_id = public.firm_id()) AND public.is_firm_admin());

-- case_updates
CREATE POLICY "case_updates_select_staff" ON case_updates FOR SELECT USING (firm_id = public.firm_id() AND public.is_firm_staff());
CREATE POLICY "case_updates_select_client" ON case_updates FOR SELECT USING (firm_id = public.firm_id() AND case_id IN (SELECT c.id FROM cases c JOIN clients cl ON c.client_id = cl.id WHERE cl.profile_id = auth.uid()));
CREATE POLICY "case_updates_insert_staff" ON case_updates FOR INSERT WITH CHECK (firm_id = public.firm_id() AND public.is_firm_staff());
CREATE POLICY "case_updates_update_own" ON case_updates FOR UPDATE USING (author_id = auth.uid() AND public.is_firm_staff());
CREATE POLICY "case_updates_delete_admin" ON case_updates FOR DELETE USING (firm_id = public.firm_id() AND public.is_firm_admin());

-- hearings
CREATE POLICY "hearings_select_staff" ON hearings FOR SELECT USING (firm_id = public.firm_id() AND public.is_firm_staff());
CREATE POLICY "hearings_select_client" ON hearings FOR SELECT USING (client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid()));
CREATE POLICY "hearings_insert_staff" ON hearings FOR INSERT WITH CHECK (firm_id = public.firm_id() AND public.is_firm_staff());
CREATE POLICY "hearings_update_staff" ON hearings FOR UPDATE USING (firm_id = public.firm_id() AND public.is_firm_staff());
CREATE POLICY "hearings_delete_admin" ON hearings FOR DELETE USING (firm_id = public.firm_id() AND public.is_firm_admin());

-- documents
CREATE POLICY "documents_select_staff" ON documents FOR SELECT USING (firm_id = public.firm_id() AND public.is_firm_staff());
CREATE POLICY "documents_select_client" ON documents FOR SELECT USING (is_shared_with_client = TRUE AND client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid()));
CREATE POLICY "documents_insert_staff" ON documents FOR INSERT WITH CHECK (firm_id = public.firm_id() AND public.is_firm_staff());
CREATE POLICY "documents_update_staff" ON documents FOR UPDATE USING (firm_id = public.firm_id() AND public.is_firm_staff());
CREATE POLICY "documents_delete_admin" ON documents FOR DELETE USING (firm_id = public.firm_id() AND public.is_firm_admin());

-- tasks
CREATE POLICY "tasks_select_staff" ON tasks FOR SELECT USING (firm_id = public.firm_id() AND public.is_firm_staff());
CREATE POLICY "tasks_insert_staff" ON tasks FOR INSERT WITH CHECK (firm_id = public.firm_id() AND public.is_firm_staff());
CREATE POLICY "tasks_update_assigned_or_admin" ON tasks FOR UPDATE USING (firm_id = public.firm_id() AND public.is_firm_staff() AND (assigned_to = auth.uid() OR public.is_firm_admin()));
CREATE POLICY "tasks_delete_admin" ON tasks FOR DELETE USING (firm_id = public.firm_id() AND public.is_firm_admin());

-- invoices
CREATE POLICY "invoices_select_staff" ON invoices FOR SELECT USING (firm_id = public.firm_id() AND public.is_firm_staff());
CREATE POLICY "invoices_select_client" ON invoices FOR SELECT USING (client_id IN (SELECT id FROM clients WHERE profile_id = auth.uid()) AND status != 'draft');
CREATE POLICY "invoices_insert_staff" ON invoices FOR INSERT WITH CHECK (firm_id = public.firm_id() AND public.is_firm_staff());
CREATE POLICY "invoices_update_staff" ON invoices FOR UPDATE USING (firm_id = public.firm_id() AND public.is_firm_staff());
CREATE POLICY "invoices_delete_admin" ON invoices FOR DELETE USING (firm_id = public.firm_id() AND public.is_firm_admin());

-- invoice_items
CREATE POLICY "invoice_items_select" ON invoice_items FOR SELECT USING (invoice_id IN (SELECT id FROM invoices WHERE firm_id = public.firm_id()));
CREATE POLICY "invoice_items_insert_staff" ON invoice_items FOR INSERT WITH CHECK (invoice_id IN (SELECT id FROM invoices WHERE firm_id = public.firm_id()) AND public.is_firm_staff());
CREATE POLICY "invoice_items_update_staff" ON invoice_items FOR UPDATE USING (invoice_id IN (SELECT id FROM invoices WHERE firm_id = public.firm_id()) AND public.is_firm_staff());
CREATE POLICY "invoice_items_delete_staff" ON invoice_items FOR DELETE USING (invoice_id IN (SELECT id FROM invoices WHERE firm_id = public.firm_id()) AND public.is_firm_staff());

-- notifications
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT USING (recipient_id = auth.uid());
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (recipient_id = auth.uid());
CREATE POLICY "notifications_insert_service" ON notifications FOR INSERT WITH CHECK (firm_id = public.firm_id());
CREATE POLICY "notifications_delete_own" ON notifications FOR DELETE USING (recipient_id = auth.uid());

-- activity_logs
CREATE POLICY "activity_logs_select_admin" ON activity_logs FOR SELECT USING (firm_id = public.firm_id() AND public.is_firm_admin());
CREATE POLICY "activity_logs_insert" ON activity_logs FOR INSERT WITH CHECK (firm_id = public.firm_id());

-- messages
CREATE POLICY "messages_select_participant" ON messages FOR SELECT USING (firm_id = public.firm_id() AND (sender_id = auth.uid() OR recipient_id = auth.uid()));
CREATE POLICY "messages_insert_participant" ON messages FOR INSERT WITH CHECK (firm_id = public.firm_id() AND sender_id = auth.uid());
CREATE POLICY "messages_update_recipient" ON messages FOR UPDATE USING (recipient_id = auth.uid());


-- ============================================================
-- 5. TRIGGERS & PROCEDURES (From Migration 003 & 004)
-- ============================================================

-- Function: update_updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply update triggers
CREATE TRIGGER trg_firms_updated_at BEFORE UPDATE ON firms FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_cases_updated_at BEFORE UPDATE ON cases FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_hearings_updated_at BEFORE UPDATE ON hearings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function: handle_new_user (Auto profile creation)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_firm_id   UUID;
  v_role      user_role;
  v_full_name TEXT;
BEGIN
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  v_firm_id := (NEW.raw_user_meta_data->>'firm_id')::UUID;
  v_role    := COALESCE(
    (NEW.raw_user_meta_data->>'role')::user_role,
    'client'
  );

  INSERT INTO profiles (id, firm_id, role, full_name, avatar_url)
  VALUES (
    NEW.id,
    v_firm_id,
    v_role,
    v_full_name,
    NEW.raw_user_meta_data->>'avatar_url'
  );

  RETURN NEW;
END;
$$;

-- Trigger: on_auth_user_created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Helper Function: create_firm_for_owner (with SECURITY DEFINER)
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

-- Helper Function: generate_invoice_number
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

-- Function: update_overdue_tasks
CREATE OR REPLACE FUNCTION update_overdue_tasks()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE tasks
  SET status = 'overdue'
  WHERE status IN ('pending', 'in_progress')
    AND due_date < CURRENT_DATE;
END;
$$;

-- Function: log_case_status_change
CREATE OR REPLACE FUNCTION log_case_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO case_updates (firm_id, case_id, author_id, update_type, title, content, old_value, new_value)
    VALUES (
      NEW.firm_id,
      NEW.id,
      auth.uid(),
      'status_change',
      'Status Updated',
      'Case status changed from ' || OLD.status || ' to ' || NEW.status,
      OLD.status::TEXT,
      NEW.status::TEXT
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_case_status_change
  AFTER UPDATE ON cases
  FOR EACH ROW EXECUTE FUNCTION log_case_status_change();


-- ============================================================
-- 6. STORAGE BUCKETS SETUP (From Migration 003)
-- ============================================================

-- Documents bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  FALSE,
  52428800,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Avatars bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  TRUE,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Firm logos bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'firm-logos',
  'firm-logos',
  TRUE,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
) ON CONFLICT (id) DO NOTHING;

-- STORAGE POLICIES
CREATE POLICY "documents_storage_select_staff" ON storage.objects FOR SELECT USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = public.firm_id()::TEXT AND public.is_firm_staff());
CREATE POLICY "documents_storage_insert_staff" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = public.firm_id()::TEXT AND public.is_firm_staff());
CREATE POLICY "documents_storage_delete_admin" ON storage.objects FOR DELETE USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = public.firm_id()::TEXT AND public.is_firm_admin());

CREATE POLICY "avatars_storage_select" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_storage_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::TEXT);
CREATE POLICY "avatars_storage_update" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

CREATE POLICY "firm_logos_storage_select" ON storage.objects FOR SELECT USING (bucket_id = 'firm-logos');
CREATE POLICY "firm_logos_storage_insert_owner" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'firm-logos' AND public.is_firm_owner());
CREATE POLICY "firm_logos_storage_update_owner" ON storage.objects FOR UPDATE USING (bucket_id = 'firm-logos' AND public.is_firm_owner());
-- ============================================================
-- Migration: 005_peshi_enhancements
-- Adds hearing_status and bench to the hearings table
-- ============================================================

-- Alter hearings table to add new columns
ALTER TABLE hearings
ADD COLUMN IF NOT EXISTS hearing_status TEXT NOT NULL DEFAULT 'scheduled',
ADD COLUMN IF NOT EXISTS bench TEXT;

-- Create an index for hearing_status for quicker filtering
CREATE INDEX IF NOT EXISTS idx_hearings_status ON hearings(hearing_status);
