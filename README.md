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

A loja usa o **Payment Brick** do Mercado Pago: o cliente paga **na própria
página de checkout**, sem ser redirecionado para outro site. Em `.env.local`:
- `MERCADOPAGO_ACCESS_TOKEN` — Access Token da sua aplicação
  (painel [Mercado Pago Developers](https://www.mercadopago.com.br/developers) →
  *Suas aplicações* → *Credenciais*). Use as de **teste** primeiro.
- `MERCADOPAGO_PUBLIC_KEY` (ou `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`) — Chave
  pública (mesma tela de credenciais). Necessária para o pagamento embutido no
  site. Prefira `MERCADOPAGO_PUBLIC_KEY` — ela é lida em tempo de execução e não
  exige rebuild ao ser alterada.
- `MERCADOPAGO_WEBHOOK_SECRET` — (opcional) segredo do webhook, para validar a
  assinatura `x-signature` das notificações.
- `NEXT_PUBLIC_SITE_URL` — URL pública (em prod: `https://www.cafedofeirantems.com.br`).

> Sem a chave pública, o checkout volta ao modo antigo (redirecionamento externo
> para o Mercado Pago).

## Aviso de pedido no WhatsApp

Quando um cliente finaliza um pedido, a loja pode receber uma mensagem
automática no WhatsApp com nome, telefone, itens e valor total.

Configure **uma** das opções abaixo em `.env.local` / Vercel:

**Opção A — WhatsApp Cloud API (Meta):**
- `WHATSAPP_CLOUD_TOKEN` — token permanente da API
- `WHATSAPP_PHONE_NUMBER_ID` — ID do número que envia as mensagens
- O destino é o número em **Configurações → WhatsApp** no painel admin
  (ou `WHATSAPP_NOTIFY_TO` para sobrescrever)

**Opção B — Webhook genérico (Z-API, Evolution API, n8n, etc.):**
- `WHATSAPP_WEBHOOK_URL` — URL que recebe `POST` com JSON
  `{ "to": "5567...", "message": "texto..." }`
- `WHATSAPP_WEBHOOK_TOKEN` — (opcional) Bearer token de autenticação

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
