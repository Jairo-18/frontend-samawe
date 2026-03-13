import { Routes } from '@angular/router';
export const publicRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./pages/home/home.component').then((m) => m.HomeComponent)
      },
      {
        path: 'accommodation',
        loadComponent: () =>
          import('./pages/accommodation/accommodation.component').then(
            (m) => m.AccommodationComponent
          )
      },
      {
        path: 'excursion',
        loadComponent: () =>
          import('./pages/excursion/excursion.component').then(
            (m) => m.ExcursionComponent
          )
      },
      {
        path: 'about-us',
        loadComponent: () =>
          import('./pages/about-us/about-us.component').then(
            (m) => m.AboutUsComponent
          )
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
