import { Routes } from '@angular/router';
export const publicRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'home',
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
