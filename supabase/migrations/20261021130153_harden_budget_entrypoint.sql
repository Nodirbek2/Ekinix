begin;
-- Keep privileged code outside the exposed Data API schema.
alter function public.consume_api_budget(text) set schema private;
grant usage on schema private to authenticated;
revoke all on all tables in schema private from authenticated;
create function public.consume_api_budget(p_kind text) returns boolean
language sql security invoker set search_path = '' as $$
 select private.consume_api_budget(p_kind);
$$;
revoke all on function public.consume_api_budget(text) from public,anon;
grant execute on function public.consume_api_budget(text) to authenticated;
commit;
