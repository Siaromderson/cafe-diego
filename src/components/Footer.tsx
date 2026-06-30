import Link from "next/link";
import { BrandMark } from "./BrandMark";
import {
  CONTENT_DEFAULTS,
  instagramLink,
  whatsappDisplay,
  whatsappLink,
  type SiteContent,
} from "@/lib/content";

export function Footer({
  content = CONTENT_DEFAULTS,
}: {
  content?: SiteContent;
}) {
  return (
    <footer className="relative mt-24 border-t border-white/10 px-6 py-14">
      <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-3">
        <div>
          <BrandMark />
          <p className="mt-4 max-w-xs text-sm text-cream/60">
            {content.footerTagline}
          </p>
        </div>
        <div>
          <h4 className="font-display text-lg text-gold">Contato</h4>
          <ul className="mt-3 space-y-2 text-sm text-cream/70">
            <li>
              <a href={whatsappLink(content.whatsapp)} className="hover:text-gold">
                WhatsApp · {whatsappDisplay(content.whatsapp)}
              </a>
            </li>
            <li>
              <a
                href={instagramLink(content.contactInstagram)}
                className="hover:text-gold"
              >
                {content.contactInstagram}
              </a>
            </li>
            <li>{content.contactAddress}</li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-lg text-gold">Entrega</h4>
          <p className="mt-3 text-sm text-cream/70">{content.footerDelivery}</p>
          <Link
            href="/cadastro"
            className="mt-4 inline-block text-sm font-medium text-gold hover:text-amber"
          >
            Cadastre-se para novidades →
          </Link>
        </div>
      </div>
      <div className="mx-auto mt-12 max-w-6xl border-t border-white/10 pt-6 text-center text-xs text-cream/40">
        © {new Date().getFullYear()} Café do Feirante MS · {content.footerCredit}
      </div>
    </footer>
  );
}
