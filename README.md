# BLIVE Finance

Sistema de Gestão Financeira para o Grupo BLIVE.

## Stack
- Vite + React + TypeScript
- Tailwind CSS v4
- Supabase (PostgreSQL, Auth, Storage)
- Recharts para gráficos

## Arranque rápido
```bash
cp .env.example .env.local
npm install
npm run dev
```

## Variáveis obrigatórias
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Estrutura
- `/submeter-pagamento` -> portal público para pedidos de pagamento
- `/login` -> autenticação Supabase
- `/admin/dashboard` -> dashboard financeiro mensal
- `/admin/pagamentos` -> fila de pedidos pendentes
- `/admin/receitas` -> registo manual de receitas

## Supabase
1. Criar projecto no Supabase.
2. Executar o SQL em `supabase/migrations/001_init_finance.sql`.
3. Criar pelo menos um utilizador autenticado no painel do Supabase Auth.
4. Copiar URL e anon key para `.env.local`.

## Notas
- A tabela `notificacoes_mock` simula emails/notificações disparadas pelo backend.
- O processamento do pagamento é feito via RPC `processar_pedido_pagamento`, que actualiza o pedido, gera a despesa e regista a notificação mock.
