-- Isolated fixtures: everything rolls back, including synthetic auth users.
begin;
insert into auth.users(id,aud,role) values ('11111111-1111-4111-8111-111111111111','authenticated','authenticated'),('22222222-2222-4222-8222-222222222222','authenticated','authenticated');
insert into public.farmers(id,user_id,full_name,region) values ('11111111-aaaa-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','MVP test A','Toshkent'),('22222222-aaaa-4222-8222-222222222222','22222222-2222-4222-8222-222222222222','MVP test B','Toshkent');
insert into public.fields(id,farmer_id,name,crop_type,area_hectares,region) values ('11111111-bbbb-4111-8111-111111111111','11111111-aaaa-4111-8111-111111111111','Test A','cotton',2,'Toshkent'),('22222222-bbbb-4222-8222-222222222222','22222222-aaaa-4222-8222-222222222222','Test B','cotton',2,'Toshkent');
set local role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
do $$ declare n integer; begin
 select count(*) into n from public.fields; if n<>1 then raise exception 'Field isolation failed'; end if;
 update public.farmers set full_name='MVP updated' where id='11111111-aaaa-4111-8111-111111111111'; get diagnostics n=row_count; if n<>1 then raise exception 'Profile update failed'; end if;
 update public.fields set name='unauthorized' where id='22222222-bbbb-4222-8222-222222222222'; get diagnostics n=row_count; if n<>0 then raise exception 'Cross-owner update allowed'; end if;
 insert into public.watering_log(field_id,water_volume_m3,method) values ('11111111-bbbb-4111-8111-111111111111',20,'drip');
 insert into public.soil_readings(field_id,moisture_vwc,depth_cm,calibrated,source,measured_at) values ('11111111-bbbb-4111-8111-111111111111',20,20,true,'manual',now());
 begin
  insert into public.watering_log(field_id,water_volume_m3,method) values ('22222222-bbbb-4222-8222-222222222222',20,'drip');
  raise exception 'Cross-owner insert allowed';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.soil_readings(field_id,moisture_vwc,depth_cm,calibrated,source,measured_at) values ('11111111-bbbb-4111-8111-111111111111',20,20,true,'device',now());
  raise exception 'Forged device source allowed';
 exception when insufficient_privilege then null; end;
 for i in 1..10 loop if not public.consume_api_budget('ai') then raise exception 'Budget denied early'; end if; end loop;
 if public.consume_api_budget('ai') then raise exception 'Budget not enforced'; end if;
end $$;
select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
do $$ begin
 if exists(select 1 from public.watering_log) or exists(select 1 from public.soil_readings) then raise exception 'Reading isolation failed'; end if;
end $$;
reset role;
rollback;
select 'PASS: ownership, profile update, watering persistence, manual measurements, device forgery rejection, quota' as result;
