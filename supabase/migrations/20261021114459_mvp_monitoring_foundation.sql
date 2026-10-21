-- Additive MVP migration. Existing farmers, fields and history are preserved.
begin;
create unique index if not exists farmers_user_id_unique on public.farmers(user_id);
alter table public.farmers alter column phone drop not null;
drop policy if exists "Users can update their own farmer profile." on public.farmers;
create policy "Users can update their own farmer profile." on public.farmers for update to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

alter table public.fields
 add column if not exists archived_at timestamptz,
 add column if not exists stage_override text check (stage_override in ('initial','development','mid','late','harvest')),
 add column if not exists field_capacity double precision check (field_capacity > 0 and field_capacity <= 70),
 add column if not exists wilting_point double precision check (wilting_point >= 0 and wilting_point < 70),
 add column if not exists root_depth_cm double precision check (root_depth_cm >= 5 and root_depth_cm <= 200),
 add column if not exists irrigation_method text not null default 'drip' check (irrigation_method in ('drip','sprinkler','furrow'));
alter table public.fields add constraint fields_soil_calibration_order check (field_capacity is null or wilting_point is null or field_capacity > wilting_point);
create index if not exists fields_farmer_id_idx on public.fields(farmer_id);
create index if not exists ndvi_readings_field_id_idx on public.ndvi_readings(field_id);

create table public.watering_log (
 id uuid primary key default gen_random_uuid(),
 field_id uuid not null references public.fields(id) on delete cascade,
 watered_at timestamptz not null default now(),
 water_volume_m3 double precision not null check (water_volume_m3 > 0 and water_volume_m3 <= 1000000),
 method text not null check (method in ('drip','sprinkler','furrow')),
 notes text check (length(notes) <= 1000),
 created_at timestamptz not null default now()
);
create index watering_log_field_date_idx on public.watering_log(field_id, watered_at desc);
alter table public.watering_log enable row level security;
create policy watering_read on public.watering_log for select to authenticated using (exists(select 1 from public.fields f join public.farmers p on p.id=f.farmer_id where f.id=field_id and p.user_id=(select auth.uid())));
create policy watering_insert on public.watering_log for insert to authenticated with check (watered_at <= now()+interval '5 minutes' and exists(select 1 from public.fields f join public.farmers p on p.id=f.farmer_id where f.id=field_id and f.archived_at is null and p.user_id=(select auth.uid())));

create table public.sensor_devices (
 id uuid primary key default gen_random_uuid(),
 field_id uuid not null references public.fields(id) on delete cascade,
 name text not null check (length(name) between 1 and 80),
 key_hash text not null check (key_hash ~ '^[0-9a-f]{64}$'),
 depth_cm integer not null check (depth_cm between 1 and 200),
 calibrated boolean not null default false,
 enabled boolean not null default true,
 created_at timestamptz not null default now()
);
create index sensor_devices_field_idx on public.sensor_devices(field_id);
alter table public.sensor_devices enable row level security;
create policy devices_owner on public.sensor_devices for all to authenticated
using(exists(select 1 from public.fields f join public.farmers p on p.id=f.farmer_id where f.id=field_id and p.user_id=(select auth.uid())))
with check(exists(select 1 from public.fields f join public.farmers p on p.id=f.farmer_id where f.id=field_id and f.archived_at is null and p.user_id=(select auth.uid())));

create table public.soil_readings (
 id uuid primary key default gen_random_uuid(),
 field_id uuid not null references public.fields(id) on delete cascade,
 device_id uuid references public.sensor_devices(id) on delete set null,
 moisture_vwc double precision not null check (moisture_vwc between 0 and 100),
 temperature_c double precision check (temperature_c between -50 and 80),
 depth_cm integer not null check (depth_cm between 1 and 200),
 calibrated boolean not null default false,
 source text not null check (source in ('manual','device')),
 measured_at timestamptz not null,
 notes text check (length(notes) <= 1000),
 created_at timestamptz not null default now(),
 unique(device_id, measured_at)
);
create index soil_readings_field_date_idx on public.soil_readings(field_id, measured_at desc);
alter table public.soil_readings enable row level security;
create policy soil_read on public.soil_readings for select to authenticated using(exists(select 1 from public.fields f join public.farmers p on p.id=f.farmer_id where f.id=field_id and p.user_id=(select auth.uid())));
create policy soil_manual_insert on public.soil_readings for insert to authenticated
with check(source='manual' and device_id is null and measured_at <= now()+interval '5 minutes' and measured_at >= now()-interval '7 days' and exists(select 1 from public.fields f join public.farmers p on p.id=f.farmer_id where f.id=field_id and f.archived_at is null and p.user_id=(select auth.uid())));

create table public.field_snapshots (
 field_id uuid primary key references public.fields(id) on delete cascade,
 payload jsonb not null,
 fetched_at timestamptz not null default now()
);
alter table public.field_snapshots enable row level security;
create policy snapshots_read on public.field_snapshots for select to authenticated using(exists(select 1 from public.fields f join public.farmers p on p.id=f.farmer_id where f.id=field_id and p.user_id=(select auth.uid())));

-- Atomic, per-account API budgets. Clients cannot edit counters.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table private.api_budgets (
 user_id uuid not null references auth.users(id) on delete cascade,
 kind text not null,
 bucket timestamptz not null,
 requests integer not null,
 primary key(user_id,kind)
);
alter table private.api_budgets enable row level security;
create function public.consume_api_budget(p_kind text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); lim integer; current_bucket timestamptz := date_trunc('hour',now()); used integer;
begin
 if uid is null then raise exception 'Authentication required'; end if;
 lim := case p_kind when 'monitoring' then 60 when 'ai' then 10 else 0 end;
 if lim=0 then raise exception 'Invalid budget'; end if;
 insert into private.api_budgets as b(user_id,kind,bucket,requests) values(uid,p_kind,current_bucket,1)
 on conflict(user_id,kind) do update set bucket=current_bucket, requests=case when b.bucket=current_bucket then b.requests+1 else 1 end
 returning requests into used;
 return used <= lim;
end; $$;
revoke all on function public.consume_api_budget(text) from public, anon;
grant execute on function public.consume_api_budget(text) to authenticated;

grant select,insert,update on public.farmers,public.fields to authenticated;
grant select,insert on public.watering_log,public.soil_readings to authenticated;
grant select,insert,update,delete on public.sensor_devices to authenticated;
grant select on public.field_snapshots to authenticated;
grant all on public.watering_log,public.soil_readings,public.sensor_devices,public.field_snapshots to service_role;
-- Existing unfinished marketplace must not allow impersonating another farmer.
drop policy if exists "Authenticated users can post listings." on public.marketplace_listings;
create policy "Authenticated users can post listings." on public.marketplace_listings for insert to authenticated with check(exists(select 1 from public.farmers p where p.id=farmer_id and p.user_id=(select auth.uid())));
commit;
