/*
  # Fix RLS Performance and Security Issues

  1. Performance Optimizations
    - Update all RLS policies to use `(select auth.uid())` instead of `auth.uid()`
    - This prevents re-evaluation of auth functions for each row
    - Significantly improves query performance at scale

  2. Security Improvements
    - Set explicit search_path on functions to prevent security vulnerabilities
    - Prevents malicious users from hijacking function behavior

  3. Changes Made
    - Drop and recreate all RLS policies with optimized auth calls
    - Update `handle_new_user` function with secure search_path
    - Update `has_active_subscription` function with secure search_path
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON subscriptions;

-- Recreate policies with optimized auth calls
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own subscription"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own subscription"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Update handle_new_user function with secure search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  
  INSERT INTO public.subscriptions (user_id, status, plan_type, trial_ends_at)
  VALUES (new.id, 'trial', 'free', now() + interval '7 days');
  
  RETURN new;
END;
$$;

-- Update has_active_subscription function with secure search_path
CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub_status text;
  trial_end timestamptz;
  sub_end timestamptz;
BEGIN
  SELECT status, trial_ends_at, subscription_ends_at
  INTO sub_status, trial_end, sub_end
  FROM subscriptions
  WHERE user_id = user_uuid;
  
  IF sub_status IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if in trial period
  IF sub_status = 'trial' AND trial_end > now() THEN
    RETURN true;
  END IF;
  
  -- Check if has active paid subscription
  IF sub_status = 'active' AND (sub_end IS NULL OR sub_end > now()) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;