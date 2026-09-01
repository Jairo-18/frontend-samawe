import { AngularNodeAppEngine, createNodeRequestHandler, isMainModule, writeResponseToNodeResponse } from '@angular/ssr/node';
import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = express();
app.disable('x-powered-by');
const angularApp = new AngularNodeAppEngine();

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
