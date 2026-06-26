-- ============================================================================
-- LexFlow — Onboarding Repair Query
-- Run this AFTER running combined_migrations.sql if you had already created
-- your user account in the Supabase Dashboard before the tables were set up.
-- ============================================================================

-- 1. Create your missing profile in the database
INSERT INTO public.profiles (id, full_name, role)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)), 'firm_owner'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 2. Link your profile to the firm you created
UPDATE public.profiles p
SET firm_id = (SELECT id FROM public.firms LIMIT 1),
    role = 'firm_owner'
WHERE p.firm_id IS NULL AND EXISTS (SELECT 1 FROM public.firms);
