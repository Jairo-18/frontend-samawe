import { RenderMode, ServerRoute } from '@angular/ssr';

const SSR: RenderMode = RenderMode.Server;

export const serverRoutes: ServerRoute[] = [
  { path: 'es',                 renderMode: SSR },
  { path: 'en',                 renderMode: SSR },
  { path: 'es/about-us',        renderMode: SSR },
  { path: 'en/about-us',        renderMode: SSR },
  { path: 'es/accommodation',   renderMode: SSR },
  { path: 'en/accommodation',   renderMode: SSR },
  // Fichas de alojamiento. Sin estas entradas caían en el `**` de abajo, o sea
  // en modo cliente: se servía el shell y su título propio ("Cabaña de piedra ·
  // Alojamiento en Mocoa…") nunca llegaba al HTML. Son justo las páginas que
  // pueden posicionar por búsquedas de tipo "cabaña en Mocoa", así que tienen
  // que renderizarse en el servidor.
  { path: 'es/accommodation/:slug', renderMode: SSR },
  { path: 'en/accommodation/:slug', renderMode: SSR },
  { path: 'es/gastronomy',      renderMode: SSR },
  { path: 'en/gastronomy',      renderMode: SSR },
  { path: 'es/how-to-arrive',   renderMode: SSR },
  { path: 'en/how-to-arrive',   renderMode: SSR },
  { path: 'es/blog',            renderMode: SSR },
  { path: 'en/blog',            renderMode: SSR },
  { path: 'es/legal/**',        renderMode: SSR },
  { path: 'en/legal/**',        renderMode: SSR },
  { path: '**',                 renderMode: RenderMode.Client }
];
