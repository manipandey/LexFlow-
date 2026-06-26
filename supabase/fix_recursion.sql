-- Fix for RLS "stack depth limit exceeded" infinite recursion
-- By making these functions SECURITY DEFINER, they bypass RLS when querying profiles,
-- which breaks the recursive loop caused by the profiles table policies relying on them.

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

CREATE OR REPLACE FUNCTION public.is_firm_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role IN ('firm_owner', 'senior_lawyer') FROM profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.is_firm_staff()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role IN ('firm_owner', 'senior_lawyer', 'lawyer', 'paralegal', 'receptionist') FROM profiles WHERE id = auth.uid()
$$;
