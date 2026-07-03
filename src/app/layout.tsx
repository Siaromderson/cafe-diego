import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, Great_Vibes } from "next/font/google";
import "./globals.css";
import { PageView } from "@/components/PageView";
import { Analytics } from "@vercel/analytics/next";

const script = Great_Vibes({
  variable: "--font-script",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Café do Feirante MS — 100% Arábica",
  description:
    "O verdadeiro café de feirante. 100% Arábica, em grãos ou moído. Peça já o seu em Campo Grande - MS.",
  openGraph: {
    title: "Café do Feirante MS — 100% Arábica",
    description:
      "O verdadeiro café de feirante. 100% Arábica, em grãos ou moído. Entrega em até 24h em Campo Grande - MS.",
    images: ["/logo.jpg"],
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${display.variable} ${body.variable} ${script.variable} antialiased`}
      >
        <PageView />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
