alter table public.pedidos_pagamento
add column if not exists email_submissor text;

update public.pedidos_pagamento
set email_submissor = coalesce(nullif(email_submissor, ''), 'sem-email@blive.local')
where email_submissor is null or email_submissor = '';

alter table public.pedidos_pagamento
alter column email_submissor set not null;
