-- =========================================================
-- QUOTE-APP ASSIGN FIRST SUPER ADMIN
-- File:
-- supabase/migrations/003_assign_super_admin.sql
--
-- Purpose:
-- - Link Supabase Auth user admin@sales-app.local
--   to public.users
-- - Assign role super_admin
--
-- Important:
-- - Auth user must already exist in Supabase Authentication
-- - Password is NOT stored here
-- =========================================================

do $$
declare
  v_auth_user_id uuid;
  v_public_user_id uuid;
  v_super_admin_role_id uuid;
begin
  -- Ambil user dari Supabase Auth
  select id
  into v_auth_user_id
  from auth.users
  where email = 'admin@sales-app.local'
  limit 1;

  if v_auth_user_id is null then
    raise exception 'Auth user admin@sales-app.local belum ada di Supabase Authentication.';
  end if;

  -- Ambil role super_admin
  select id
  into v_super_admin_role_id
  from public.roles
  where role_code = 'super_admin'
  limit 1;

  if v_super_admin_role_id is null then
    raise exception 'Role super_admin belum ada. Jalankan migration RBAC terlebih dahulu.';
  end if;

  -- Insert / update user internal
  insert into public.users (
    auth_user_id,
    full_name,
    email,
    phone,
    status,
    created_by
  )
  values (
    v_auth_user_id,
    'Super Admin',
    'admin@sales-app.local',
    null,
    'active',
    null
  )
  on conflict (email)
  do update set
    auth_user_id = excluded.auth_user_id,
    full_name = excluded.full_name,
    status = 'active',
    updated_at = now()
  returning id into v_public_user_id;

  -- Assign role super_admin
  insert into public.user_roles (
    user_id,
    role_id
  )
  values (
    v_public_user_id,
    v_super_admin_role_id
  )
  on conflict (user_id, role_id)
  do nothing;

  raise notice 'admin@sales-app.local berhasil di-assign sebagai SuperAdmin.';
  raise notice 'auth_user_id: %', v_auth_user_id;
  raise notice 'public_user_id: %', v_public_user_id;
end $$;