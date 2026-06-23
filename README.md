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

## Ativar pagamento (NuPay / SpinPay)

Em `.env.local`:
- `NUPAY_BASE_URL` — `https://sandbox-api.spinpay.com.br` (teste) ou `https://api.spinpay.com.br`
- `NUPAY_MERCHANT_KEY`, `NUPAY_MERCHANT_TOKEN`
- `NEXT_PUBLIC_SITE_URL` — URL pública (em prod: `https://www.cafedofeirantems.com.br`)

O webhook de status é `POST /api/webhooks/nupay` — configure essa URL no painel NuPay.

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
