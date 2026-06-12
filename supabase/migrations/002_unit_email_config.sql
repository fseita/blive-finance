create table if not exists public.unidade_email_config (
  unidade_id uuid primary key references public.unidades(id) on delete cascade,
  novo_pedido_email text,
  pedido_pago_email text,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.unidade_email_config enable row level security;

create policy "unidade_email_config_manage_authenticated"
on public.unidade_email_config
for all
to authenticated
using (true)
with check (true);

insert into public.unidade_email_config (unidade_id)
select id
from public.unidades
on conflict (unidade_id) do nothing;

create or replace function public.touch_unidade_email_config_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_touch_unidade_email_config_updated_at on public.unidade_email_config;
create trigger trg_touch_unidade_email_config_updated_at
before update on public.unidade_email_config
for each row
execute function public.touch_unidade_email_config_updated_at();

create or replace function public.seed_unidade_email_config_for_new_unidade()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.unidade_email_config (unidade_id)
  values (new.id)
  on conflict (unidade_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_seed_unidade_email_config_for_new_unidade on public.unidades;
create trigger trg_seed_unidade_email_config_for_new_unidade
after insert on public.unidades
for each row
execute function public.seed_unidade_email_config_for_new_unidade();
