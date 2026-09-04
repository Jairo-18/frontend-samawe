import { Routes } from '@angular/router';
export const publicRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        data: { reuse: true },
        loadComponent: () =>
          import('./pages/home/home.component').then((m) => m.HomeComponent)
      },
      {
        path: 'about-us',
        data: { reuse: true },
        loadComponent: () =>
          import('./pages/about-us/about-us.component').then(
            (m) => m.AboutUsComponent
          )
      },
      {
        path: 'accommodation',
        data: { reuse: true },
        loadComponent: () =>
          import('./pages/accommodation/accommodation.component').then(
            (m) => m.AccommodationComponent
          )
      },
      {
        // El segmento es `:slug` y no `:id` porque la URL lleva
        // "6-cabana-1": el id delante para resolver, el resto solo para que
        // sea legible y para SEO. El id es el mismo en ES y EN, así que el
        // par de hreflang sale directo sin traducir slugs.
        // Pública a propósito: sin sesión también se ve. El login se pide
        // recién al reservar.
        path: 'accommodation/:slug',
        loadComponent: () =>
          import(
            './pages/accommodation-detail/accommodation-detail.component'
          ).then((m) => m.AccommodationDetailComponent)
      },
      {
        path: 'gastronomy',
        data: { reuse: true },
        loadComponent: () =>
          import('./pages/gastronomy/gastronomy.component').then(
            (m) => m.GastronomyComponent
          )
      },
      {
        path: 'how-to-arrive',
        data: { reuse: true },
        loadComponent: () =>
          import('./pages/how-to-arrive/how-to-arrive.component').then(
            (m) => m.HowToArriveComponent
          )
      },
      {
        path: 'blog',
        data: { reuse: true },
        loadComponent: () =>
          import('./pages/blog/blog.component').then((m) => m.BlogComponent)
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/settings/settings.component').then(
            (m) => m.SettingsComponent
          )
      },
      {
        path: 'legal/privacity',
        data: { reuse: true },
        loadComponent: () =>
          import('./pages/legal/privacity/privacity.component').then(
            (m) => m.PrivacityComponent
          )
      },
      {
        path: 'legal/terms',
        data: { reuse: true },
        loadComponent: () =>
          import('./pages/legal/terms/terms.component').then(
            (m) => m.TermsComponent
          )
      }
    ]
  }
];
