"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BRL } from "@/lib/types";
import { useCart } from "@/store/cart";
import { BrandMark } from "@/components/BrandMark";
import { type PayMethod, feeCentsForPct } from "@/lib/payments";

interface ShipOption {
  key: string;
  label: string;
  cents: number;
  eta: string;
}

const PICKUP_KEY = "pickup";

export default function CheckoutPage() {
  const { lines, total, clear } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cepLoading, setCepLoading] = useState(false);

  const [shipOptions, setShipOptions] = useState<ShipOption[]>([]);
  const [shipMethod, setShipMethod] = useState<string>("delivery");
  const [payMethods, setPayMethods] = useState<PayMethod[]>([]);
  const [payMethod, setPayMethod] = useState<string>("pix");

  useEffect(() => {
    fetch("/api/shipping")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d?.options)) setShipOptions(d.options);
        if (Array.isArray(d?.payMethods) && d.payMethods.length) {
          setPayMethods(d.payMethods);
          // Garante que a forma selecionada existe entre as ativas.
          setPayMethod((cur) =>
            d.payMethods.some((m: PayMethod) => m.key === cur)
              ? cur
              : d.payMethods[0].key
          );
        }
      })
      .catch(() => {});
  }, []);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    district: "",
    city: "",
    reference: "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function lookupCep(raw: string) {
    const cep = raw.replace(/\D/g, "");
    if (cep.length !== 8) return;
    setCepLoading(true);
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const d = await r.json();
      if (!d.erro) {
        setForm((f) => ({
          ...f,
          street: d.logradouro || f.street,
          district: d.bairro || f.district,
          city: d.localidade || f.city,
        }));
      }
    } catch {
      /* ignora */
    } finally {
      setCepLoading(false);
    }
  }

  const isPickup = shipMethod === PICKUP_KEY;
  const selectedOption = shipOptions.find((o) => o.key === shipMethod);
  const shippingCents = isPickup ? 0 : selectedOption?.cents ?? 0;
  const subtotal = total();
  const selectedPay = payMethods.find((m) => m.key === payMethod);
  const feeCents = feeCentsForPct(
    selectedPay?.feePct ?? 0,
    subtotal + shippingCents
  );
  const grandTotal = subtotal + shippingCents + feeCents;

  async function submit() {
    setError(null);
    if (!form.name || !form.phone) {
      setError("Preencha nome e telefone.");
      return;
    }
    if (!isPickup) {
      if (!form.cep || !form.street || !form.number || !form.district) {
        setError("Complete o endereço de entrega.");
        return;
      }
      if (!form.city) {
        setError("Informe a cidade de entrega.");
        return;
      }
    }
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: form.name,
            phone: form.phone,
          },
          address: {
            cep: form.cep,
            street: form.street,
            number: form.number,
            complement: form.complement,
            district: form.district,
            city: form.city,
            reference: form.reference,
          },
          items: lines.map((l) => ({ id: l.product.id, qty: l.qty })),
          shippingMethod: shipMethod,
          paymentMethod: payMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Não foi possível finalizar.");
        return;
      }
      clear();
      window.location.href = data.paymentUrl;
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (lines.length === 0) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
        <BrandMark />
        <p className="font-display mt-8 text-2xl text-cream">
          Seu carrinho está vazio
        </p>
        <Link
          href="/#produtos"
          className="btn-gold mt-6 rounded-full px-8 py-3 text-sm uppercase tracking-wide"
        >
          Ver produtos
        </Link>
      </main>
    );
  }

  const input =
    "w-full rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-cream placeholder:text-cream/35 outline-none transition-colors focus:border-gold/60";

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <Link href="/" className="inline-block">
        <BrandMark />
      </Link>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        {/* Formulário */}
        <div className="glass rounded-3xl p-6 sm:p-8">
          <h1 className="font-display text-3xl font-semibold text-cream">
            Finalizar pedido
          </h1>
          <p className="mt-1 text-sm text-cream/60">
            Pagamento pelo Mercado Pago. ⚡ Entrega em até 24h ou retire no local
            sem custo.
          </p>

          <h2 className="font-display mt-7 text-lg text-gold">Seus dados</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              className={input}
              placeholder="Nome completo"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
            <input
              className={input}
              placeholder="WhatsApp (DDD)"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </div>

          {/* Forma de entrega */}
          <h2 className="font-display mt-7 text-lg text-gold">
            Como você quer receber?
          </h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {shipOptions.map((o) => (
              <label
                key={o.key}
                className={`flex cursor-pointer flex-col gap-1 rounded-xl border px-4 py-3 text-sm transition-colors ${
                  shipMethod === o.key
                    ? "border-gold/60 bg-gold/10 text-cream"
                    : "border-white/12 bg-white/5 text-cream/80 hover:border-gold/40"
                }`}
              >
                <span className="flex items-center justify-between">
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="ship"
                      className="accent-gold"
                      checked={shipMethod === o.key}
                      onChange={() => setShipMethod(o.key)}
                    />
                    {o.label}
                  </span>
                  <span className="text-gold">
                    {o.cents > 0 ? BRL(o.cents) : "Grátis"}
                  </span>
                </span>
                <span className="pl-7 text-xs text-cream/50">{o.eta}</span>
              </label>
            ))}
          </div>

          {/* Endereço — só quando há entrega */}
          {!isPickup && (
            <>
              <h2 className="font-display mt-7 text-lg text-gold">
                Endereço de entrega
              </h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-6">
                <div className="sm:col-span-2">
                  <input
                    className={input}
                    placeholder="CEP"
                    value={form.cep}
                    onChange={(e) => set("cep", e.target.value)}
                    onBlur={(e) => lookupCep(e.target.value)}
                  />
                  {cepLoading && (
                    <span className="mt-1 block text-xs text-gold/70">
                      buscando…
                    </span>
                  )}
                </div>
                <input
                  className={`${input} sm:col-span-4`}
                  placeholder="Rua / Logradouro"
                  value={form.street}
                  onChange={(e) => set("street", e.target.value)}
                />
                <input
                  className={`${input} sm:col-span-2`}
                  placeholder="Número"
                  value={form.number}
                  onChange={(e) => set("number", e.target.value)}
                />
                <input
                  className={`${input} sm:col-span-4`}
                  placeholder="Complemento (opcional)"
                  value={form.complement}
                  onChange={(e) => set("complement", e.target.value)}
                />
                <input
                  className={`${input} sm:col-span-3`}
                  placeholder="Bairro"
                  value={form.district}
                  onChange={(e) => set("district", e.target.value)}
                />
                <input
                  className={`${input} sm:col-span-3`}
                  placeholder="Cidade"
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                />
                <input
                  className={`${input} sm:col-span-6`}
                  placeholder="Ponto de referência (opcional)"
                  value={form.reference}
                  onChange={(e) => set("reference", e.target.value)}
                />
              </div>

              {form.cep.replace(/\D/g, "").length === 8 && selectedOption && (
                <p className="mt-3 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-cream/80">
                  Frete <strong>{BRL(shippingCents)}</strong> · {selectedOption.eta}.
                </p>
              )}
            </>
          )}

          {isPickup && (
            <p className="mt-3 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-cream/80">
              Você retira no local, sem custo de entrega. 🛍️ Avisamos no
              WhatsApp quando estiver pronto.
            </p>
          )}

          {/* Forma de pagamento */}
          <h2 className="font-display mt-7 text-lg text-gold">
            Forma de pagamento
          </h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {payMethods.map((m) => (
              <label
                key={m.key}
                className={`flex cursor-pointer flex-col gap-0.5 rounded-xl border px-4 py-3 text-sm transition-colors ${
                  payMethod === m.key
                    ? "border-gold/60 bg-gold/10 text-cream"
                    : "border-white/12 bg-white/5 text-cream/80 hover:border-gold/40"
                }`}
              >
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="pay"
                    className="accent-gold"
                    checked={payMethod === m.key}
                    onChange={() => setPayMethod(m.key)}
                  />
                  {m.label}
                </span>
                <span className="pl-6 text-xs text-cream/50">
                  {m.feePct > 0
                    ? `+ ${m.feePct.toLocaleString("pt-BR")}% de taxa`
                    : "Sem taxa"}
                </span>
              </label>
            ))}
          </div>

          {error && (
            <p className="mt-4 rounded-xl border border-wine-bright/50 bg-wine/25 px-4 py-3 text-sm text-cream">
              {error}
            </p>
          )}
        </div>

        {/* Resumo */}
        <aside className="glass-strong h-fit rounded-3xl p-6">
          <h2 className="font-display text-xl text-cream">Seu pedido</h2>
          <ul className="mt-4 space-y-3">
            {lines.map((l) => (
              <li
                key={l.product.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="text-cream/80">
                  {l.qty}× {l.product.name}
                </span>
                <span className="text-cream/90">
                  {BRL(l.product.price_cents * l.qty)}
                </span>
              </li>
            ))}
          </ul>
          <div className="gold-hairline my-4" />
          <div className="flex justify-between text-sm text-cream/70">
            <span>Subtotal</span>
            <span className="text-cream/90">{BRL(subtotal)}</span>
          </div>
          <div className="mt-2 flex justify-between text-sm text-cream/70">
            <span>{isPickup ? "Retirada no local" : "Entrega"}</span>
            <span className="text-gold">
              {shippingCents > 0 ? BRL(shippingCents) : "Grátis"}
            </span>
          </div>
          {feeCents > 0 && (
            <div className="mt-2 flex justify-between text-sm text-cream/70">
              <span>Taxa de pagamento</span>
              <span className="text-gold">{BRL(feeCents)}</span>
            </div>
          )}
          <div className="mt-3 flex items-end justify-between">
            <span className="text-cream/70">Total</span>
            <span className="font-display text-3xl font-semibold gold-text">
              {BRL(grandTotal)}
            </span>
          </div>
          <button
            onClick={submit}
            disabled={loading}
            className="btn-gold mt-6 w-full rounded-full py-3.5 text-sm uppercase tracking-wide disabled:opacity-60"
          >
            {loading ? "Processando…" : "Pagar agora"}
          </button>
          <p className="mt-3 text-center text-xs text-cream/45">
            Pagamento seguro · Mercado Pago
          </p>
          <Link
            href="/#produtos"
            className="mt-3 block text-center text-xs text-cream/50 hover:text-gold"
          >
            ← continuar comprando
          </Link>
        </aside>
      </div>
    </main>
  );
}
