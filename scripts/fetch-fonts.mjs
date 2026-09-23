// Baja del CSS de Google Fonts los woff2 del subset `latin` y genera el SCSS
// con los @font-face apuntando a los archivos locales.
//
//   node scripts/fetch-fonts.mjs
//
// PARA AÑADIR UNA FUENTE AL CATÁLOGO son tres pasos:
//   1. Añadirla a FAMILIES, aquí abajo.
//   2. Ejecutar este script (reescribe assets/fonts/_catalog.scss entero).
//   3. Añadirla a TITLE_FONTS o BODY_FONTS en
//      src/app/shared/constants/fonts.constants.ts — si no, no aparece en el
//      desplegable de Aplicación → Apariencia y el valor guardado se ignora.
//
// Regenerarlo es seguro: `_catalog.scss` se sobreescribe siempre, así que no
// hay que editarlo nunca a mano.
//
// Se pide con User-Agent de Chrome a propósito: Google sirve formatos distintos
// según el navegador y solo los modernos reciben woff2 (con un UA viejo manda
// ttf, que pesa diez veces más).
//
// Solo el subset `latin`: cubre acentos y ñ (U+00C0–00FF), que es lo que el
// español necesita. `latin-ext` es para lenguas del centro y este de Europa.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT_DIR = 'C:/Trabajo/samawe/frontend-samawe/src/assets/fonts';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

// [familia, pesos, ¿incluir cursiva?]
const FAMILIES = [
  // ── Las dos que ya usaba el proyecto ──
  // Alegreya SC estaba en .ttf local (1,5 MB entre sus cuatro variantes) y
  // Poppins llegaba por <link> a fonts.googleapis.com, o sea una petición a un
  // tercero en cada visita. Las dos pasan aquí: mismo origen, mismo formato.
  ['Alegreya SC', [400, 700], true],
  ['Poppins', [300, 400, 500, 600, 700], false],
  // ── Títulos ──
  ['Cinzel', [400, 700], false],
  ['Playfair Display', [400, 700], false],
  ['Cormorant Garamond', [400, 700], false],
  ['Marcellus', [400], false],
  ['Lora', [400, 700], false],
  // ── Cuerpo ──
  ['Lato', [300, 400, 700], false],
  ['Inter', [300, 400, 500, 600, 700], false],
  ['Source Sans 3', [300, 400, 500, 600, 700], false],
  ['Nunito Sans', [300, 400, 500, 600, 700], false],
  ['Work Sans', [300, 400, 500, 600, 700], false]
];

const slug = (f) => f.toLowerCase().replace(/\s+/g, '-');

async function get(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res;
}

let scss = `/* ARCHIVO GENERADO — no editar a mano.
   Lo produce scratchpad/fetch-fonts.mjs a partir de Google Fonts.
   Todas las familias del catálogo de tipografía, subset latin, woff2.

   Declararlas todas NO penaliza al visitante: el navegador solo descarga
   la familia que alguna regla CSS llegue a usar. */\n\n`;

for (const [family, weights, italics] of FAMILIES) {
  const dir = join(OUT_DIR, slug(family));
  mkdirSync(dir, { recursive: true });

  const styles = italics ? [0, 1] : [0];
  const axis = italics ? 'ital,wght' : 'wght';
  const spec = styles
    .flatMap((i) => weights.map((w) => (italics ? `${i},${w}` : `${w}`)))
    .join(';');
  const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    family
  )}:${axis}@${spec}&display=swap`;

  const css = await (await get(cssUrl)).text();

  // Solo los bloques del subset latin.
  const blocks = css
    .split('/*')
    .filter((b) => b.trimStart().startsWith('latin */'))
    .map((b) => b.slice(b.indexOf('*/') + 2));

  // Muchas familias de Google son VARIABLES: un único archivo cubre todo el
  // rango de grosores y el CSS lo repite en un @font-face por peso, siempre
  // con la misma URL. Guardar uno por peso son copias idénticas del mismo
  // fichero (Inter eran 5 × 47 KB para 47 KB de contenido). Se deduplica por
  // el contenido y, si hay un solo archivo para varios pesos, se declara con
  // `font-weight: <min> <max>`, que es como se declara una variable.
  const byUrl = new Map();
  for (const block of blocks) {
    const weight = block.match(/font-weight:\s*([\d\s]+);/)?.[1].trim() ?? '400';
    const style = block.match(/font-style:\s*(\w+);/)?.[1] ?? 'normal';
    const url = block.match(/url\((https:[^)]+\.woff2)\)/)?.[1];
    if (!url) continue;
    const key = `${url}|${style}`;
    if (!byUrl.has(key)) byUrl.set(key, { url, style, weights: [] });
    byUrl.get(key).weights.push(...weight.split(/\s+/).map(Number));
  }

  for (const { url, style, weights: ws } of byUrl.values()) {
    const min = Math.min(...ws);
    const max = Math.max(...ws);
    const variable = min !== max;
    const suffix = variable ? 'variable' : String(min);
    const name = `${slug(family)}-${suffix}${
      style === 'italic' ? '-italic' : ''
    }.woff2`;

    const buf = Buffer.from(await (await get(url)).arrayBuffer());
    writeFileSync(join(dir, name), buf);

    scss += `@font-face {
  font-family: '${family}';
  src: url('/assets/fonts/${slug(family)}/${name}') format('woff2');
  font-weight: ${variable ? `${min} ${max}` : min};
  font-style: ${style};
  font-display: swap;
}\n\n`;
    console.log(
      `  ${name}  ${Math.round(buf.length / 1024)} KB${
        variable ? `  (variable ${min}–${max})` : ''
      }`
    );
  }
  console.log(`${family}: ${byUrl.size} archivo(s)`);
}

writeFileSync(join(OUT_DIR, '_catalog.scss'), scss, 'utf8');
console.log('\nSCSS escrito en assets/fonts/_catalog.scss');
