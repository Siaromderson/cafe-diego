import { BrandMark } from "./BrandMark";

export function Footer() {
  return (
    <footer className="relative mt-24 border-t border-white/10 px-6 py-14">
      <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-3">
        <div>
          <BrandMark />
          <p className="mt-4 max-w-xs text-sm text-cream/60">
            O verdadeiro café de feirante. 100% Arábica, torrado com cuidado
            artesanal em Campo Grande — MS.
          </p>
        </div>
        <div>
          <h4 className="font-display text-lg text-gold">Contato</h4>
          <ul className="mt-3 space-y-2 text-sm text-cream/70">
            <li>
              <a
                href="https://wa.me/5567992220619"
                className="hover:text-gold"
              >
                WhatsApp · 67 99222-0619
              </a>
            </li>
            <li>
              <a
                href="https://instagram.com/cafedofeirantems"
                className="hover:text-gold"
              >
                @cafedofeirantems
              </a>
            </li>
            <li>Rua Dr. Arthur Jorge 1602 · São Francisco</li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-lg text-gold">Entrega</h4>
          <p className="mt-3 text-sm text-cream/70">
            Entrega grátis em Campo Grande, prazo de até 2 dias úteis. Retire na
            feira ou peça pelo site e pague no Pix, débito ou crédito.
          </p>
        </div>
      </div>
      <div className="mx-auto mt-12 max-w-6xl border-t border-white/10 pt-6 text-center text-xs text-cream/40">
        © {new Date().getFullYear()} Café do Feirante MS · Diego Ricardo
        Rodrigues · Campo Grande - MS
      </div>
    </footer>
  );
}
