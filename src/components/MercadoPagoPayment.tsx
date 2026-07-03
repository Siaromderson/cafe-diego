"use client";

import { useEffect, useState } from "react";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";

export interface MercadoPagoPaymentProps {
  publicKey: string;
  preferenceId: string;
  amount: number;
  referenceId: string;
  payMethod: string;
  onApproved: () => void;
  onError: (message: string) => void;
}

interface PixData {
  qrCode: string;
  qrCodeBase64: string;
  ticketUrl: string;
}

/**
 * Mostra no Brick apenas a forma escolhida na loja, pra bater com a taxa e o
 * total já calculados. Pix = bankTransfer · saldo = mercadoPago · crédito =
 * creditCard.
 */
function paymentMethodsFor(payMethod: string) {
  switch (payMethod) {
    case "pix":
      return { bankTransfer: "all", maxInstallments: 1 } as const;
    case "saldo":
      return { mercadoPago: "all", maxInstallments: 1 } as const;
    case "credit":
    default:
      return { creditCard: "all", maxInstallments: 12 } as const;
  }
}

/** Tela do QR Code Pix — o cliente paga sem sair do site. */
function PixQrCode({
  pix,
  paymentId,
  onApproved,
}: {
  pix: PixData;
  paymentId: string | null;
  onApproved: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);

  // Verifica o status a cada 5s — quando o Pix cair, avança sozinho.
  useEffect(() => {
    if (!paymentId) return;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/status?paymentId=${paymentId}`);
        const data = await res.json().catch(() => ({}));
        if (data?.paid) {
          clearInterval(timer);
          onApproved();
        }
      } catch {
        /* segue tentando */
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [paymentId, onApproved]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(pix.qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  async function checkNow() {
    if (!paymentId) return;
    setChecking(true);
    try {
      const res = await fetch(`/api/payments/status?paymentId=${paymentId}`);
      const data = await res.json().catch(() => ({}));
      if (data?.paid) onApproved();
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="text-center text-coffee-2">
      <h3 className="font-display text-xl font-semibold">Pague com Pix</h3>
      <p className="mt-1 text-sm text-coffee-2/70">
        Abra o app do seu banco, escaneie o QR Code ou use o Pix copia e cola.
      </p>

      {pix.qrCodeBase64 && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`data:image/png;base64,${pix.qrCodeBase64}`}
          alt="QR Code do Pix"
          className="mx-auto mt-4 h-56 w-56 rounded-xl border border-coffee-2/10"
        />
      )}

      <div className="mt-4">
        <p className="text-xs uppercase tracking-widest text-coffee-2/50">
          Pix copia e cola
        </p>
        <div className="mt-1 flex items-center gap-2">
          <input
            readOnly
            value={pix.qrCode}
            className="w-full truncate rounded-lg border border-coffee-2/15 bg-coffee-2/5 px-3 py-2 text-xs text-coffee-2"
          />
          <button
            type="button"
            onClick={copy}
            className="shrink-0 rounded-lg bg-[#b07c2a] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#8f6320]"
          >
            {copied ? "Copiado!" : "Copiar"}
          </button>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-center gap-2 text-sm text-coffee-2/70">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-500" />
        Aguardando o pagamento… confirmamos automaticamente.
      </div>

      <button
        type="button"
        onClick={checkNow}
        disabled={checking || !paymentId}
        className="mt-3 text-xs font-medium text-[#b07c2a] underline underline-offset-2 disabled:opacity-50"
      >
        {checking ? "Verificando…" : "Já paguei, verificar agora"}
      </button>
    </div>
  );
}

export function MercadoPagoPayment({
  publicKey,
  preferenceId,
  amount,
  referenceId,
  payMethod,
  onApproved,
  onError,
}: MercadoPagoPaymentProps) {
  const [pix, setPix] = useState<PixData | null>(null);
  const [pixPaymentId, setPixPaymentId] = useState<string | null>(null);

  useEffect(() => {
    initMercadoPago(publicKey, { locale: "pt-BR" });
  }, [publicKey]);

  return (
    <div className="mp-brick mt-6 rounded-2xl border border-gold/25 bg-white p-4 sm:p-5">
      {pix ? (
        <PixQrCode pix={pix} paymentId={pixPaymentId} onApproved={onApproved} />
      ) : (
        <>
          <p className="mb-4 text-center text-xs text-coffee-2/70">
            Pagamento seguro pelo Mercado Pago — você permanece neste site.
          </p>
          <Payment
            key={payMethod}
            initialization={{
              amount,
              preferenceId,
            }}
            customization={{
              paymentMethods: paymentMethodsFor(payMethod),
              visual: {
                style: {
                  theme: "default",
                  // Cores da marca: dourado do Café do Feirante nos botões,
                  // seleção e destaques, com cantos arredondados como o site.
                  customVariables: {
                    baseColor: "#b07c2a",
                    baseColorFirstVariant: "#c8952f",
                    baseColorSecondVariant: "#8f6320",
                    buttonTextColor: "#2a1a0d",
                    successColor: "#2f855a",
                    borderRadiusSmall: "8px",
                    borderRadiusMedium: "12px",
                    borderRadiusLarge: "16px",
                    borderRadiusFull: "9999px",
                  },
                },
              },
            }}
            onSubmit={async ({ formData }) => {
              const res = await fetch("/api/payments/process", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ formData, referenceId }),
              });
              const data = await res.json().catch(() => ({}));
              if (!res.ok) {
                onError(data.error || "Não foi possível processar o pagamento.");
                throw new Error(data.error || "payment_failed");
              }

              const status = (data.status || "").toLowerCase();

              // Pix: mostra o QR Code na hora e aguarda a confirmação.
              if (data.pix?.qrCode) {
                setPixPaymentId(data.id ? String(data.id) : null);
                setPix(data.pix);
                return;
              }

              if (status === "approved" || status === "authorized") {
                onApproved();
                return;
              }
              if (status === "pending" || status === "in_process") {
                onApproved();
                return;
              }
              onError("Pagamento não aprovado. Tente outra forma de pagamento.");
              throw new Error("payment_rejected");
            }}
            onError={(error) => {
              const msg =
                error && typeof error === "object" && "message" in error
                  ? String((error as { message?: string }).message)
                  : "Erro ao carregar o pagamento.";
              onError(msg);
            }}
          />
        </>
      )}
    </div>
  );
}
