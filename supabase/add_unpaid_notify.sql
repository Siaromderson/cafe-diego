-- ============================================================
--  Aviso de pedido NÃO PAGO no WhatsApp da loja
--  Cole no SQL Editor do Supabase e clique RUN.
--
--  A loja já recebe um aviso quando um pedido é PAGO. Esta coluna
--  marca o momento em que a loja também foi avisada de um pedido
--  que NÃO foi pago (recusado/expirado ou abandonado), para que o
--  mesmo pedido não gere aviso repetido na varredura automática.
--
--  Nada é enviado ao cliente: o aviso vai só para o número da loja
--  e o vendedor entra em contato depois.
-- ============================================================

alter table cafe_diego_orders
  add column if not exists unpaid_notified_at timestamptz;
