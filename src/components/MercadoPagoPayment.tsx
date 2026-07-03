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

export function MercadoPagoPayment({
  publicKey,
  preferenceId,
  amount,
  referenceId,
  payMethod: _payMethod,
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
        initialization={{
          amount,
          preferenceId,
        }}
        customization={{
          paymentMethods: {
            creditCard: "all",
            maxInstallments: 12,
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
