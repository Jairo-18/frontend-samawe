import { AngularNodeAppEngine, createNodeRequestHandler, isMainModule, writeResponseToNodeResponse } from '@angular/ssr/node';
import compression from 'compression';
import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = express();
app.disable('x-powered-by');

// Compresión gzip/brotli de todo lo que sirve el SSR: el HTML renderizado y los
// bundles de `express.static`.
//
// Va lo primero para envolver a los middlewares posteriores. Ojo con la
// expectativa: Cloudflare ya sirve brotli al visitante, así que esto NO cambia
// lo que descarga el usuario final; ahorra ancho de banda en el tramo
// origen → CDN y cubre el caso de que algo no pase por Cloudflare.
app.use(compression({ threshold: 1024 }));

/**
 * Estas dos piezas —`trustProxyHeaders` y el middleware de abajo— son las que
 * hacen que el SSR funcione DETRÁS DE TRAEFIK. Sin ellas el servidor responde
 * 200 con `index.csr.html` y `<app-root></app-root>` vacío en lugar del HTML
 * renderizado.
 *
 * El fallo era invisible desde el navegador (la app hidrata igual) pero
 * Googlebot, Bing y los previsualizadores de enlaces recibían una página en
 * blanco, y con ella se perdía todo lo que hace `SeoService`: title por página,
 * canonical y hreflang. En los logs del contenedor solo se veía
 * "Received x-forwarded-server header but trustProxyHeaders was not set up".
 *
 * Angular descarta cualquier `X-Forwarded-*` que no tenga autorizada, y al
 * hacerlo deja de renderizar. Traefik manda cinco (`proto`, `host`, `for`,
 * `port`, `server`), así que se confía en todas: el único cliente que llega a
 * este proceso es Traefik, que las reescribe en cada salto, y el contenedor no
 * está expuesto directamente a internet.
 */
const angularApp = new AngularNodeAppEngine({
  trustProxyHeaders: true,
});

/**
 * `X-Forwarded-Server` es la excepción: **tumba el render aunque
 * `trustProxyHeaders` sea `true`**. Se aisló probando las cinco cabeceras una a
 * una contra el build de producción:
 *
 *   sin cabeceras / proto / host / for / port  → renderiza
 *   + x-forwarded-server                       → NO renderiza
 *
 * Falla con cualquier valor, incluido un host que sí está en `allowedHosts`, o
 * sea que no es validación de host: Angular no la admite y punto. Como no
 * aporta nada al render —solo dice qué proxy atendió la petición— se descarta
 * antes de llegar al engine.
 *
 * Se hace aquí y no con un middleware de Traefik para que el arreglo viaje con
 * el repositorio y no dependa de la configuración de Dokploy.
 */
app.use((req, _res, next) => {
  delete req.headers['x-forwarded-server'];
  next();
});

const legacyRedirects: Record<string, string> = {
  '/nosotros':    '/es/about-us',
  '/paquetes':    '/es/accommodation',
  '/samawe-1':   '/es/accommodation',
  '/excursion':  '/es/how-to-arrive',
  '/home':        '/es',
  '/accommodation': '/es/accommodation',
  '/about-us':   '/es/about-us',
  '/gastronomy':  '/es/gastronomy',
  '/how-to-arrive': '/es/how-to-arrive',
  '/blog':        '/es/blog',
  // URLs del sitio anterior que Google sigue rastreando (Search Console).
  // Sin entrada propia caían en el comodín '**' y terminaban redirigidas a la
  // portada, que Google interpreta como soft 404; se mandan a la página
  // equivalente para conservar la señal del enlace entrante.
  '/cabanas':          '/es/accommodation',
  '/camping':          '/es/accommodation',
  '/senderos-cascada': '/es/how-to-arrive',
};

app.use((req, res, next) => {
  const target = legacyRedirects[req.path];
  if (target) {
    return res.redirect(301, target);
  }
  // www → non-www (skip extra hop on root by going directly to /es)
  if (req.hostname.startsWith('www.')) {
    const newHost = req.hostname.slice(4);
    const targetPath = req.path === '/' ? '/es' : req.url;
    return res.redirect(301, `https://${newHost}${targetPath}`);
  }
  next();
});

app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

app.use('/**', (req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
