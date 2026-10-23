-- Cleanup: Remove unused platform admin bootstrap infrastructure
-- The bootstrap code system is no longer needed since platform admin signup was removed from frontend.
-- The single platform admin was already created via the original bootstrap migration.
-- This migration safely removes the now-unused objects.

-- 1. Drop the trigger that listens for platform_admin signup_type (never fired anymore)
drop trigger if exists provision_platform_admin_bootstrap_after_signup on auth.users;

-- 2. Drop the trigger function
drop function if exists private.provision_platform_admin_bootstrap();

-- 3. Drop the bootstrap codes table (hash storage for one-time codes)
drop table if exists private.platform_admin_bootstrap_codes;

-- Note: The platform_admins table and the existing admin user remain intact.
-- The private.is_platform_admin() function (database-backed version from 20261020182000) remains.
-- The private.claim_first_platform_admin() function remains as a safety net.