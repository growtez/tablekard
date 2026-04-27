-- ============================================================
-- TABLEKARD — COMPLETE DYNAMIC DATABASE RESET
-- Drops EVERYTHING in the public schema using system catalogs.
-- Safe to run even if tables/policies don't match schema files.
-- After running: apply schema.sql → fix_rls_public_access.sql
-- ============================================================


-- ============================================================
-- STEP 1: DROP ALL RLS POLICIES (on every table in public schema)
-- ============================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      r.policyname, r.schemaname, r.tablename
    );
  END LOOP;
END $$;


-- ============================================================
-- STEP 2: DISABLE RLS ON ALL TABLES IN public SCHEMA
-- ============================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format(
      'ALTER TABLE IF EXISTS public.%I DISABLE ROW LEVEL SECURITY',
      r.tablename
    );
  END LOOP;
END $$;


-- ============================================================
-- STEP 3: DROP ALL VIEWS IN public SCHEMA
-- ============================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT table_name
    FROM information_schema.views
    WHERE table_schema = 'public'
  LOOP
    EXECUTE format(
      'DROP VIEW IF EXISTS public.%I CASCADE',
      r.table_name
    );
  END LOOP;
END $$;


-- ============================================================
-- STEP 4: DROP ALL TABLES IN public SCHEMA (CASCADE)
-- ============================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format(
      'DROP TABLE IF EXISTS public.%I CASCADE',
      r.tablename
    );
  END LOOP;
END $$;


-- ============================================================
-- STEP 5: DROP ALL FUNCTIONS & PROCEDURES IN public SCHEMA
-- ============================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT ns.nspname        AS schema,
           p.proname         AS name,
           pg_get_function_identity_arguments(p.oid) AS args,
           p.prokind         AS kind
    FROM pg_proc p
    JOIN pg_namespace ns ON ns.oid = p.pronamespace
    WHERE ns.nspname = 'public'
      AND p.proname NOT LIKE 'pg_%'  -- skip any system functions
  LOOP
    IF r.kind = 'p' THEN
      EXECUTE format(
        'DROP PROCEDURE IF EXISTS public.%I(%s) CASCADE',
        r.name, r.args
      );
    ELSE
      EXECUTE format(
        'DROP FUNCTION IF EXISTS public.%I(%s) CASCADE',
        r.name, r.args
      );
    END IF;
  END LOOP;
END $$;


-- ============================================================
-- STEP 6: DROP ALL SEQUENCES IN public SCHEMA
-- ============================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT sequence_name
    FROM information_schema.sequences
    WHERE sequence_schema = 'public'
  LOOP
    EXECUTE format(
      'DROP SEQUENCE IF EXISTS public.%I CASCADE',
      r.sequence_name
    );
  END LOOP;
END $$;


-- ============================================================
-- STEP 7: DROP ALL CUSTOM TYPES / ENUMS IN public SCHEMA
-- ============================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT t.typname AS name
    FROM pg_type t
    JOIN pg_namespace ns ON ns.oid = t.typnamespace
    WHERE ns.nspname = 'public'
      AND t.typtype IN ('e', 'c')  -- e = enum, c = composite type
  LOOP
    EXECUTE format(
      'DROP TYPE IF EXISTS public.%I CASCADE',
      r.name
    );
  END LOOP;
END $$;


-- ============================================================
-- STEP 8: DROP ALL TRIGGERS IN public SCHEMA
-- ============================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT trigger_name, event_object_table
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS %I ON public.%I CASCADE',
      r.trigger_name, r.event_object_table
    );
  END LOOP;
END $$;


-- ============================================================
-- VERIFICATION — shows what's left (should all be empty)
-- ============================================================

SELECT 'tables'    AS type, count(*) FROM pg_tables        WHERE schemaname = 'public'
UNION ALL
SELECT 'views'     AS type, count(*) FROM information_schema.views WHERE table_schema = 'public'
UNION ALL
SELECT 'functions' AS type, count(*) FROM pg_proc p
  JOIN pg_namespace ns ON ns.oid = p.pronamespace WHERE ns.nspname = 'public'
UNION ALL
SELECT 'enums'     AS type, count(*) FROM pg_type t
  JOIN pg_namespace ns ON ns.oid = t.typnamespace
  WHERE ns.nspname = 'public' AND t.typtype = 'e'
UNION ALL
SELECT 'policies'  AS type, count(*) FROM pg_policies WHERE schemaname = 'public';


-- ============================================================
-- DONE — public schema is now completely clean.
-- Next steps:
--   1. Run supabase/schema.sql
--   2. Run supabase/fix_rls_public_access.sql
-- ============================================================
