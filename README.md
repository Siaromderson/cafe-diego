# Café do Feirante MS — Loja Online

Loja de café profissional: vitrine, carrinho, checkout com pagamento NuPay,
painel admin e área do cliente. Next.js 16 + Supabase + Tailwind v4.

## Rodar local

```bash
npm install
cp .env.example .env.local   # preencha as chaves quando tiver
npm run dev                  # http://localhost:3000
```

> A loja funciona **sem Supabase/NuPay**: usa o catálogo estático
> (`src/lib/catalog.ts`) e o checkout entra em **modo demonstração**
> (pagamento simulado). Ao preencher as chaves, tudo passa a usar banco e
> pagamento reais automaticamente.

## Ativar banco (Supabase)

1. Crie um projeto em supabase.com.
2. Rode a migration `supabase/migrations/0001_init.sql` e depois `supabase/seed.sql`
   (SQL Editor ou MCP).
3. Cadastre o admin: `insert into admins (email) values ('SEU_EMAIL');`
4. Preencha em `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

## Ativar pagamento (Mercado Pago)

A loja usa o **Checkout Pro**: o cliente é redirecionado ao Mercado Pago e
escolhe Pix, débito ou crédito. Em `.env.local`:
- `MERCADOPAGO_ACCESS_TOKEN` — Access Token da sua aplicação
  (painel [Mercado Pago Developers](https://www.mercadopago.com.br/developers) →
  *Suas aplicações* → *Credenciais*). Use as de **teste** primeiro.
- `MERCADOPAGO_WEBHOOK_SECRET` — (opcional) segredo do webhook, para validar a
  assinatura `x-signature` das notificações.
- `NEXT_PUBLIC_SITE_URL` — URL pública (em prod: `https://www.cafedofeirantems.com.br`).

O webhook de status é `POST /api/webhooks/mercadopago` — cadastre essa URL no
painel do Mercado Pago (*Webhooks*), assinando o evento **Pagamentos**.

> Se houver chaves NuPay configuradas e nenhuma do Mercado Pago, a loja usa a
> NuPay como fallback. Sem nenhuma das duas, o checkout entra em modo
> demonstração (pagamento simulado).

## Estrutura

| Rota | Descrição |
|------|-----------|
| `/` | Vitrine (hero, produtos, história, entrega) |
| `/checkout` | Dados + endereço (ViaCEP) + pagamento |
| `/checkout/sucesso` · `/cancelado` | Retornos do pagamento |
| `/login` | Acesso por link mágico (admin e cliente) |
| `/admin` | Pedidos + status (protegido por `admins`) |
| `/admin/produtos` | CRUD de produtos/preços/estoque |
| `/admin/config` | Frete, prazo, WhatsApp |
| `/conta` | Pedidos do cliente |

## Deploy (Vercel)

1. Importe este repositório na Vercel.
2. Configure as mesmas variáveis de ambiente.
3. Aponte o domínio `www.cafedofeirantems.com.br`.
4. Defina `NEXT_PUBLIC_SITE_URL` com o domínio final e registre o webhook na NuPay.
