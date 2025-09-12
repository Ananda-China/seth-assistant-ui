-- Add password_hash column to users table for password login (nullable)
alter table if exists public.users
  add column if not exists password_hash text;

