"use client";

import {
  formatPhoneAsYouType,
  isValidBrazilPhone,
  phoneForSubmit,
  preparePhone,
} from "@/lib/phone";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  /** Exibe mensagem de erro abaixo do campo. Padrão: true */
  showHint?: boolean;
}

/**
 * Campo de WhatsApp/telefone com máscara automática.
 * O lead pode digitar só os números — o DDD e a formatação entram sozinhos.
 */
export function PhoneInput({
  value,
  onChange,
  className = "",
  placeholder = "(67) 99999-0000",
  showHint = true,
}: PhoneInputProps) {
  const prepared = preparePhone(value);
  const valid = !value.trim() || isValidBrazilPhone(prepared);

  function handleChange(raw: string) {
    onChange(formatPhoneAsYouType(raw));
  }

  function handleBlur() {
    if (!value.trim()) return;
    const formatted = formatPhoneAsYouType(phoneForSubmit(value));
    if (formatted !== value) onChange(formatted);
  }

  return (
    <div>
      <input
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder={placeholder}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        className={`${className} ${
          !valid && value.trim() ? "border-wine-bright/60" : ""
        }`.trim()}
      />
      {showHint && value.trim() && !valid && (
        <span className="mt-1 block text-xs text-wine-bright/90">
          Número incompleto — digite o WhatsApp com DDD ou só o número (ex.:
          99999-0000).
        </span>
      )}
    </div>
  );
}
