create type public.app_role as enum ('admin','staff');
create type public.claim_status as enum ('received','under_review','being_handled','update_available');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Users read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create table public.claims (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  tracking_token uuid not null unique default gen_random_uuid(),
  customer_name text not null,
  email text not null,
  phone text,
  category text not null,
  order_number text,
  description text not null,
  status claim_status not null default 'received',
  status_updated_at timestamptz not null default now(),
  reply text,
  internal_note text,
  seen boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, update on public.claims to authenticated;
grant all on public.claims to service_role;
alter table public.claims enable row level security;
create policy "Admins read claims" on public.claims for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "Admins update claims" on public.claims for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.claim_tracking (
  token uuid primary key,
  status claim_status not null,
  status_updated_at timestamptz not null,
  reply text
);
grant select on public.claim_tracking to anon, authenticated;
grant all on public.claim_tracking to service_role;
alter table public.claim_tracking enable row level security;
create policy "Anyone can read tracking by token" on public.claim_tracking for select to anon, authenticated using (true);

create or replace function public.sync_claim_tracking()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and (new.status is distinct from old.status or new.reply is distinct from old.reply) then
    new.status_updated_at := now();
  end if;
  insert into public.claim_tracking(token,status,status_updated_at,reply)
  values (new.tracking_token,new.status,new.status_updated_at,new.reply)
  on conflict (token) do update set status=excluded.status, status_updated_at=excluded.status_updated_at, reply=excluded.reply;
  return new;
end $$;
create trigger claims_sync_tracking before insert or update on public.claims
for each row execute function public.sync_claim_tracking();

alter publication supabase_realtime add table public.claims;
alter publication supabase_realtime add table public.claim_tracking;