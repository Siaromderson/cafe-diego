"use client";

export interface ReportRow {
  id: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  status: string;
  total_cents: number;
  shipping_cents: number;
  shipping_method: string | null;
  city: string;
  items: string;
}

const STATUS: Record<string, string> = {
  pending: "Aguardando",
  paid: "Pago",
  delivered: "Entregue",
  canceled: "Cancelado",
};

function csvEscape(v: string) {
  if (/[";\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export function ExportButton({
  rows,
  label = "Exportar relatório",
  filename = "relatorio",
}: {
  rows: ReportRow[];
  label?: string;
  filename?: string;
}) {
  function exportCsv() {
    const header = [
      "Pedido",
      "Data",
      "Cliente",
      "Telefone",
      "E-mail",
      "Cidade",
      "Status",
      "Itens",
      "Frete (R$)",
      "Forma de frete",
      "Total (R$)",
    ];
    const lines = rows.map((r) =>
      [
        r.id.slice(0, 8),
        new Date(r.created_at).toLocaleString("pt-BR"),
        r.customer_name,
        r.customer_phone,
        r.customer_email,
        r.city,
        STATUS[r.status] ?? r.status,
        r.items,
        (r.shipping_cents / 100).toFixed(2).replace(".", ","),
        r.shipping_method ?? "",
        (r.total_cents / 100).toFixed(2).replace(".", ","),
      ]
        .map((c) => csvEscape(String(c ?? "")))
        .join(";")
    );
    // BOM p/ acentos abrirem certo no Excel
    const csv = "﻿" + [header.join(";"), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={exportCsv}
      disabled={rows.length === 0}
      className="btn-ghost rounded-full px-4 py-2 text-sm disabled:opacity-40"
    >
      ⬇ {label}
    </button>
  );
}
