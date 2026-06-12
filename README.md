# BLIVE Finance

Sistema de Gestão Financeira para o Grupo BLIVE.

## Stack
- Vite + React + TypeScript
- Tailwind CSS v4
- Supabase (PostgreSQL, Auth, Storage)
- Recharts para gráficos
- Netlify Functions para automatismos de email
- AgentMail para envio de notificações

## Arranque rápido
```bash
cp .env.example .env.local
npm install
npm run dev
```

## Variáveis obrigatórias
### Frontend
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Server-side / Netlify Functions
- `SUPABASE_SERVICE_ROLE_KEY`
- `AGENTMAIL_API_KEY`
- `AGENTMAIL_INBOX` (inbox AgentMail usado para enviar estes emails)

## Estrutura
- `/submeter-pagamento` -> portal público para pedidos de pagamento
- `/login` -> autenticação Supabase
- `/admin/dashboard` -> dashboard financeiro mensal
- `/admin/pagamentos` -> fila de pedidos pendentes
- `/admin/receitas` -> registo manual de receitas
- `/admin/configuracoes` -> configuração dos emails automáticos por unidade

## Supabase
1. Criar projecto no Supabase.
2. Executar o SQL em `supabase/migrations/001_init_finance.sql`.
3. Executar também `supabase/migrations/002_unit_email_config.sql`.
4. Criar pelo menos um utilizador autenticado no painel do Supabase Auth.
5. Copiar URL e anon key para `.env.local`.
6. Adicionar `SUPABASE_SERVICE_ROLE_KEY`, `AGENTMAIL_API_KEY` e `AGENTMAIL_INBOX` no ambiente do Netlify.

## Emails automáticos
- Novo pedido submetido -> envia email para o endereço configurado em `Email para novo pedido` da unidade.
- Pedido marcado como pago -> envia email para o endereço configurado em `Email para pedido pago` da unidade.
- Os endereços são geridos na área `/admin/configuracoes`.

## Notas
- A tabela `notificacoes_mock` continua a servir de log simples para os envios processados.
- O processamento do pagamento é feito via RPC `processar_pedido_pagamento`, que actualiza o pedido, gera a despesa e regista a notificação mock.
