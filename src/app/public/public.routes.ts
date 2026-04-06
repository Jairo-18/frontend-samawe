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
        loadComponent: () =>
          import('./pages/about-us/about-us.component').then(
            (m) => m.AboutUsComponent
          )
      },
      {
        path: 'accommodation',
        loadComponent: () =>
          import('./pages/accommodation/accommodation.component').then(
            (m) => m.AccommodationComponent
          )
      },
      {
        path: 'gastronomy',
        loadComponent: () =>
          import('./pages/gastronomy/gastronomy.component').then(
            (m) => m.GastronomyComponent
          )
      },
      {
        path: 'how-to-arrive',
        loadComponent: () =>
          import('./pages/how-to-arrive/how-to-arrive.component').then(
            (m) => m.HowToArriveComponent
          )
      },
      {
        path: 'blog',
        loadComponent: () =>
          import('./pages/blog/blog.component').then((m) => m.BlogComponent)
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/settings/settings.component').then(
            (m) => m.SettingsComponent
          )
      }
    ]
  }
];
