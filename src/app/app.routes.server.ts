import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'home',
    renderMode: RenderMode.Server
  },
  {
    path: 'about-us',
    renderMode: RenderMode.Server
  },
  {
    path: 'accommodation',
    renderMode: RenderMode.Server
  },
  {
    path: 'gastronomy',
    renderMode: RenderMode.Server
  },
  {
    path: 'how-to-arrive',
    renderMode: RenderMode.Server
  },
  {
    path: 'legal/**',
    renderMode: RenderMode.Server
  },
  {
    path: '**',
    renderMode: RenderMode.Client
  }
];
