/**
 * Comprueba que el servidor SSR construido REALMENTE renderiza.
 *
 * Existe porque el SSR puede quedar servido "a medias" sin que nada falle: el
 * proceso levanta, responde 200 y devuelve el `index.html` con
 * `<app-root></app-root>` vacío. La web sigue viéndose porque el navegador
 * hidrata por su cuenta, así que el fallo es invisible para cualquiera que la
 * abra — pero Googlebot, Bing y los previsualizadores de WhatsApp o Facebook
 * reciben una página en blanco, y todo el trabajo de `SeoService` (title por
 * página, canonical, hreflang) se pierde.
 *
 * `fix-ssr-manifest.mjs` parchea el bundle minificado con expresiones regulares
 * y tiene una salida temprana ("Manifest imports already present"): si algún día
 * ese parche deja de encajar, el build pasa igualmente. Esto lo convierte en un
 * fallo ruidoso.
 *
 * Ejecutar tras el build y el parche:  node scripts/verify-ssr.mjs
 */
import { spawn } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverEntry = resolve(
  __dirname,
  '../dist/frontend-samawe/server/server.mjs',
);
// `localhost` a propósito, no 127.0.0.1: el servidor valida el header Host
// contra el `allowedHosts` de angular.json y la IP no está en esa lista.
const PORT = process.env['VERIFY_SSR_PORT'] || '4123';
const PATH_TO_CHECK = process.env['VERIFY_SSR_PATH'] || '/es';
const TIMEOUT_MS = 60_000;

const child = spawn(process.execPath, [serverEntry], {
  env: { ...process.env, PORT },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let serverOutput = '';
child.stdout.on('data', (d) => (serverOutput += d));
child.stderr.on('data', (d) => (serverOutput += d));

function finish(ok, message) {
  child.kill();
  console[ok ? 'log' : 'error'](message);
  process.exit(ok ? 0 : 1);
}

async function waitForServer() {
  const deadline = Date.now() + TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      return finish(
        false,
        `verify-ssr: el servidor murió al arrancar.\n${serverOutput.slice(-1500)}`,
      );
    }
    try {
      const res = await fetch(`http://localhost:${PORT}${PATH_TO_CHECK}`);
      if (res.ok) return res.text();
    } catch {
      // todavía levantando
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return finish(
    false,
    `verify-ssr: el servidor no respondió en ${TIMEOUT_MS / 1000}s.\n${serverOutput.slice(-1500)}`,
  );
}

const html = await waitForServer();
if (typeof html !== 'string') process.exit(1);

const checks = [
  {
    ok: html.includes('ng-server-context="ssr"'),
    error:
      'falta el marcador ng-server-context="ssr": el HTML no salió del render de Angular',
  },
  {
    ok: !/<app-root[^>]*>\s*<\/app-root>/.test(html),
    error: '<app-root> viene vacío: se está sirviendo el shell sin renderizar',
  },
  {
    ok: /<link rel="canonical"/.test(html),
    error: 'no hay <link rel="canonical">: SeoService no llegó a ejecutarse',
  },
];

const failed = checks.filter((c) => !c.ok);
if (failed.length) {
  finish(
    false,
    'verify-ssr: EL SSR NO ESTÁ RENDERIZANDO\n' +
      failed.map((f) => `  · ${f.error}`).join('\n') +
      '\n  Revisa que scripts/fix-ssr-manifest.mjs se haya aplicado sobre este build.',
  );
}

finish(
  true,
  `verify-ssr: OK — ${PATH_TO_CHECK} renderizado en el servidor (${html.length} bytes, con canonical).`,
);
