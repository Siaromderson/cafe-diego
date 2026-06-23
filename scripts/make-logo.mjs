import sharp from "sharp";
import path from "path";

const src = path.resolve("imagens/logo.jpeg");
const out = path.resolve("public/logo.png");

const img = sharp(src).ensureAlpha();
const { data, info } = await img
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height, channels } = info;

// Rampa de transparência: fundo escuro -> transparente; preserva cores saturadas.
const LUM_LO = 20; // abaixo disso = fundo (transparente)
const LUM_HI = 78; // acima disso = totalmente opaco
const SAT_KEEP = 38; // pixels coloridos (xícara/dourado) ficam opacos

const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);
const edge = Math.round(Math.min(width, height) * 0.05); // borda suave de 5%

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const i = (y * width + x) * channels;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const sat = Math.max(r, g, b) - Math.min(r, g, b);

    let a;
    if (sat >= SAT_KEEP) {
      a = 255; // vermelho/dourado/branco -> opaco
    } else {
      a = clamp(((lum - LUM_LO) / (LUM_HI - LUM_LO)) * 255);
    }

    // feather nas bordas do retângulo, pra não ficar "seco"
    const dx = Math.min(x, width - 1 - x);
    const dy = Math.min(y, height - 1 - y);
    const d = Math.min(dx, dy);
    if (d < edge) a = a * (d / edge);

    data[i + 3] = Math.round(a);
  }
}

await sharp(data, { raw: { width, height, channels } })
  .png()
  .toFile(out);

console.log("OK ->", out, `${width}x${height}`);
