insert into public.unidades (nome, conta_bancaria_nome)
values ('Blive Pilates Alvalade', 'Conta Operacional Alvalade')
on conflict (nome) do nothing;
