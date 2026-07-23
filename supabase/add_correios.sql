-- ============================================================
--  Integração Correios — código de rastreio no pedido
--  Cole no SQL Editor do Supabase e clique RUN.
--
--  O cálculo de frete (SEDEX/PAC) e a consulta de rastreio usam a
--  API dos Correios (CWS) e são ligados por variáveis de ambiente
--  (veja o README). Aqui só precisamos guardar o código de rastreio
--  que o admin cola no pedido depois de postar.
-- ============================================================

alter table cafe_diego_orders
  add column if not exists tracking_code text;
