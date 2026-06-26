-- ============================================================
-- LexFlow - Migration 003: Functions, Triggers & Storage
-- ============================================================

-- ============================================================
-- FUNCTION: update_updated_at
-- Automatically updates the updated_at column on row change
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply the trigger to all relevant tables
CREATE TRIGGER trg_firms_updated_at
  BEFORE UPDATE ON firms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_cases_updated_at
  BEFORE UPDATE ON cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_hearings_updated_at
  BEFORE UPDATE ON hearings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- FUNCTION: handle_new_user
-- Auto-creates a profile when a new user signs up via Supabase Auth
-- ============================================================

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
  -- Extract metadata from the auth user
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  -- Check if user was invited to an existing firm
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

-- Trigger: fire after new user is inserted into auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- FUNCTION: create_firm_for_new_owner
-- Called from server action during onboarding to create firm + subscription
-- ============================================================

CREATE OR REPLACE FUNCTION create_firm_for_owner(
  p_user_id     UUID,
  p_firm_name   TEXT,
  p_slug        TEXT,
  p_email       TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_firm_id UUID;
BEGIN
  -- Create the firm
  INSERT INTO firms (name, slug, email)
  VALUES (p_firm_name, p_slug, p_email)
  RETURNING id INTO v_firm_id;

  -- Create starter subscription
  INSERT INTO subscriptions (firm_id, plan, status, max_team_members, max_clients)
  VALUES (v_firm_id, 'starter', 'trialing', 3, 100);

  -- Update user's profile with firm_id and role = firm_owner
  UPDATE profiles
  SET firm_id = v_firm_id,
      role    = 'firm_owner'
  WHERE id = p_user_id;

  RETURN v_firm_id;
END;
$$;

-- ============================================================
-- FUNCTION: generate_invoice_number
-- Auto-generates sequential invoice number per firm
-- ============================================================

CREATE OR REPLACE FUNCTION generate_invoice_number(p_firm_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INT;
  v_year  TEXT;
BEGIN
  v_year  := TO_CHAR(NOW(), 'YYYY');
  SELECT COUNT(*) INTO v_count
  FROM invoices
  WHERE firm_id = p_firm_id
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());

  RETURN 'INV-' || v_year || '-' || LPAD((v_count + 1)::TEXT, 4, '0');
END;
$$;

-- ============================================================
-- FUNCTION: generate_case_number
-- Auto-generates sequential case number per firm
-- ============================================================

CREATE OR REPLACE FUNCTION generate_case_number(p_firm_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INT;
  v_year  TEXT;
BEGIN
  v_year  := TO_CHAR(NOW(), 'YYYY');
  SELECT COUNT(*) INTO v_count
  FROM cases
  WHERE firm_id = p_firm_id
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());

  RETURN 'CASE-' || v_year || '-' || LPAD((v_count + 1)::TEXT, 4, '0');
END;
$$;

-- ============================================================
-- FUNCTION: update_task_status_overdue
-- Marks overdue tasks automatically (run as scheduled job or called on-demand)
-- ============================================================

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

-- ============================================================
-- FUNCTION: log_case_status_change
-- Automatically logs case status changes to case_updates
-- ============================================================

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
-- SUPABASE STORAGE: Create buckets
-- ============================================================

-- Documents bucket (private — requires signed URLs)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  FALSE,
  52428800, -- 50MB limit
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
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Firm logos bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'firm-logos',
  'firm-logos',
  TRUE,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STORAGE RLS POLICIES
-- ============================================================

-- Documents: staff can manage, clients can download shared docs
CREATE POLICY "documents_storage_select_staff"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = public.firm_id()::TEXT
    AND public.is_firm_staff()
  );

CREATE POLICY "documents_storage_insert_staff"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = public.firm_id()::TEXT
    AND public.is_firm_staff()
  );

CREATE POLICY "documents_storage_delete_admin"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = public.firm_id()::TEXT
    AND public.is_firm_admin()
  );

-- Avatars: users manage their own
CREATE POLICY "avatars_storage_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_storage_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "avatars_storage_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

-- Firm logos: firm owner manages, everyone can view
CREATE POLICY "firm_logos_storage_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'firm-logos');

CREATE POLICY "firm_logos_storage_insert_owner"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'firm-logos'
    AND public.is_firm_owner()
  );

CREATE POLICY "firm_logos_storage_update_owner"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'firm-logos'
    AND public.is_firm_owner()
  );
