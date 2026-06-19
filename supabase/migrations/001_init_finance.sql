create extension if not exists pgcrypto;

create table if not exists public.unidades (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  conta_bancaria_nome text
);

create table if not exists public.pedidos_pagamento (
  id uuid primary key default gen_random_uuid(),
  criado_em timestamptz not null default timezone('utc', now()),
  unidade_id uuid not null references public.unidades(id) on delete restrict,
  nome_submissor text not null,
  email_submissor text not null,
  iban text not null,
  valor numeric(12,2) not null check (valor > 0),
  data_limite date not null,
  descricao text not null,
  ficheiro_url text not null,
  estado text not null default 'Pendente' check (estado in ('Pendente', 'Pago', 'Recusado'))
);

create table if not exists public.transacoes (
  id uuid primary key default gen_random_uuid(),
  data_transacao date not null,
  unidade_id uuid not null references public.unidades(id) on delete restrict,
  tipo text not null check (tipo in ('Receita', 'Despesa')),
  valor numeric(12,2) not null check (valor > 0),
  metodo text not null,
  categoria text not null,
  pedido_pagamento_id uuid references public.pedidos_pagamento(id) on delete set null
);

create table if not exists public.notificacoes_mock (
  id bigint generated always as identity primary key,
  criado_em timestamptz not null default timezone('utc', now()),
  tipo text not null,
  destino text,
  assunto text not null,
  payload jsonb not null default '{}'::jsonb
);

insert into public.unidades (nome, conta_bancaria_nome)
values
  ('Blive Pilates Beja', 'Conta Operacional Beja'),
  ('Blive Pilates Évora', 'Conta Operacional Évora'),
  ('Blive Pilates Areeiro', 'Conta Operacional Areeiro'),
  ('Blive Pilates Príncipe Real', 'Conta Operacional Príncipe Real'),
  ('Blive Pilates Telheiras', 'Conta Operacional Telheiras'),
  ('Blive Padel', 'Conta Operacional Padel')
on conflict (nome) do nothing;

alter table public.unidades enable row level security;
alter table public.pedidos_pagamento enable row level security;
alter table public.transacoes enable row level security;
alter table public.notificacoes_mock enable row level security;

create policy "unidades_read_public"
on public.unidades
for select
using (true);

create policy "unidades_manage_authenticated"
on public.unidades
for all
to authenticated
using (true)
with check (true);

create policy "pedidos_insert_public"
on public.pedidos_pagamento
for insert
to anon, authenticated
with check (estado = 'Pendente');

create policy "pedidos_manage_authenticated"
on public.pedidos_pagamento
for all
to authenticated
using (true)
with check (true);

create policy "transacoes_manage_authenticated"
on public.transacoes
for all
to authenticated
using (true)
with check (true);

create policy "notificacoes_mock_authenticated_read"
on public.notificacoes_mock
for select
to authenticated
using (true);

create or replace function public.registar_notificacao_mock(
  p_tipo text,
  p_destino text,
  p_assunto text,
  p_payload jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notificacoes_mock (tipo, destino, assunto, payload)
  values (p_tipo, p_destino, p_assunto, coalesce(p_payload, '{}'::jsonb));
end;
$$;

create or replace function public.handle_novo_pedido_pagamento()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.registar_notificacao_mock(
    'novo_pedido_pagamento',
    'gestao@blive.pt',
    'Novo pedido de pagamento submetido',
    jsonb_build_object(
      'pedido_id', new.id,
      'unidade_id', new.unidade_id,
      'nome_submissor', new.nome_submissor,
      'valor', new.valor,
      'estado', new.estado
    )
  );

  return new;
end;
$$;

drop trigger if exists trg_handle_novo_pedido_pagamento on public.pedidos_pagamento;
create trigger trg_handle_novo_pedido_pagamento
after insert on public.pedidos_pagamento
for each row
execute function public.handle_novo_pedido_pagamento();

create or replace function public.processar_pedido_pagamento(
  p_pedido_id uuid,
  p_categoria text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pedido public.pedidos_pagamento%rowtype;
begin
  select * into v_pedido
  from public.pedidos_pagamento
  where id = p_pedido_id
  for update;

  if not found then
    raise exception 'Pedido não encontrado';
  end if;

  if v_pedido.estado <> 'Pendente' then
    raise exception 'Pedido já processado';
  end if;

  update public.pedidos_pagamento
  set estado = 'Pago'
  where id = p_pedido_id;

  insert into public.transacoes (
    data_transacao,
    unidade_id,
    tipo,
    valor,
    metodo,
    categoria,
    pedido_pagamento_id
  )
  values (
    current_date,
    v_pedido.unidade_id,
    'Despesa',
    v_pedido.valor,
    'Transferência',
    p_categoria,
    v_pedido.id
  );

  perform public.registar_notificacao_mock(
    'pagamento_processado',
    v_pedido.nome_submissor,
    'O teu pedido de pagamento foi marcado como pago',
    jsonb_build_object(
      'pedido_id', v_pedido.id,
      'valor', v_pedido.valor,
      'categoria', p_categoria
    )
  );
end;
$$;

grant execute on function public.registar_notificacao_mock(text, text, text, jsonb) to anon, authenticated;
grant execute on function public.processar_pedido_pagamento(uuid, text) to authenticated;

insert into storage.buckets (id, name, public)
values ('comprovativos-pagamento', 'comprovativos-pagamento', true)
on conflict (id) do nothing;

create policy "storage_public_upload_pagamentos"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'comprovativos-pagamento');

create policy "storage_public_read_pagamentos"
on storage.objects
for select
using (bucket_id = 'comprovativos-pagamento');
