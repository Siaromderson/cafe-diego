"use client";

import { useEffect } from "react";
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

/**
 * Mostra no Brick apenas a forma escolhida na loja, pra bater com a taxa e o
 * total já calculados. Pix = bankTransfer · saldo = mercadoPago · crédito =
 * creditCard. O saldo sempre acompanha (o MP não permite excluí-lo).
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

export function MercadoPagoPayment({
  publicKey,
  preferenceId,
  amount,
  referenceId,
  payMethod,
  onApproved,
  onError,
}: MercadoPagoPaymentProps) {
  useEffect(() => {
    initMercadoPago(publicKey, { locale: "pt-BR" });
  }, [publicKey]);

  return (
    <div className="mp-brick mt-6 rounded-2xl border border-gold/25 bg-white p-4 sm:p-5">
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
          if (status === "approved" || status === "authorized" || status === "pending" || status === "in_process") {
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
    </div>
  );
}
