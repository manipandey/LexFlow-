-- ============================================================
-- LexFlow - Law Firm Management System
-- Migration 001: Initial Schema
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- ENUMS
-- ============================================================

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

-- ============================================================
-- TABLE: firms
-- Root of multi-tenancy. Every other record links to a firm.
-- ============================================================

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

-- ============================================================
-- TABLE: subscriptions
-- One subscription per firm.
-- ============================================================

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

-- ============================================================
-- TABLE: profiles
-- Extended user info linked to auth.users
-- ============================================================

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

-- ============================================================
-- TABLE: clients
-- Client records per firm.
-- ============================================================

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

-- ============================================================
-- TABLE: cases
-- Legal case records.
-- ============================================================

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
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(firm_id, case_number)
);

CREATE INDEX idx_cases_firm_id ON cases(firm_id);
CREATE INDEX idx_cases_client_id ON cases(client_id);
CREATE INDEX idx_cases_status ON cases(firm_id, status);
CREATE INDEX idx_cases_assigned_lawyer ON cases(assigned_lawyer_id);
CREATE INDEX idx_cases_title ON cases USING gin(to_tsvector('english', title));

-- ============================================================
-- TABLE: case_team_members
-- Many-to-many: cases <-> profiles (team members on a case)
-- ============================================================

CREATE TABLE case_team_members (
  case_id         UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_on_case    TEXT,
  added_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (case_id, profile_id)
);

CREATE INDEX idx_case_team_case_id ON case_team_members(case_id);
CREATE INDEX idx_case_team_profile_id ON case_team_members(profile_id);

-- ============================================================
-- TABLE: case_updates
-- Timeline / activity log for each case.
-- ============================================================

CREATE TABLE case_updates (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id         UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  case_id         UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  author_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  update_type     TEXT NOT NULL DEFAULT 'note', -- note | status_change | document | hearing
  title           TEXT,
  content         TEXT NOT NULL,
  old_value       TEXT,           -- for status changes
  new_value       TEXT,           -- for status changes
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_case_updates_case_id ON case_updates(case_id);
CREATE INDEX idx_case_updates_firm_id ON case_updates(firm_id);

-- ============================================================
-- TABLE: hearings
-- Court hearings, meetings, consultations.
-- ============================================================

CREATE TABLE hearings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id         UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  case_id         UUID REFERENCES cases(id) ON DELETE SET NULL,
  client_id       UUID REFERENCES clients(id) ON DELETE SET NULL,
  assigned_lawyer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  hearing_type    TEXT NOT NULL DEFAULT 'hearing', -- hearing | meeting | consultation
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

-- ============================================================
-- TABLE: documents
-- File metadata. Actual files stored in Supabase Storage.
-- ============================================================

CREATE TABLE documents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id         UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  case_id         UUID REFERENCES cases(id) ON DELETE SET NULL,
  client_id       UUID REFERENCES clients(id) ON DELETE SET NULL,
  uploaded_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  original_name   TEXT NOT NULL,
  file_path       TEXT NOT NULL,  -- Supabase Storage path
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

-- ============================================================
-- TABLE: tasks
-- Task management.
-- ============================================================

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

-- ============================================================
-- TABLE: invoices
-- Billing invoices per client/case.
-- ============================================================

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

-- ============================================================
-- TABLE: invoice_items
-- Line items within an invoice.
-- ============================================================

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

-- ============================================================
-- TABLE: notifications
-- In-app notification center.
-- ============================================================

CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id         UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  recipient_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type            notification_type NOT NULL DEFAULT 'system',
  title           TEXT NOT NULL,
  message         TEXT,
  link            TEXT,           -- e.g. /cases/uuid
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  read_at         TIMESTAMPTZ,
  related_id      UUID,           -- FK to any related record
  related_type    TEXT,           -- 'case' | 'hearing' | 'task' | etc.
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, is_read);
CREATE INDEX idx_notifications_firm_id ON notifications(firm_id);
CREATE INDEX idx_notifications_created ON notifications(recipient_id, created_at DESC);

-- ============================================================
-- TABLE: activity_logs
-- Audit trail for all significant actions.
-- ============================================================

CREATE TABLE activity_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firm_id         UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action          activity_action NOT NULL,
  entity_type     TEXT NOT NULL,  -- 'client' | 'case' | 'document' | etc.
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

-- ============================================================
-- TABLE: messages
-- Client portal messaging.
-- ============================================================

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
