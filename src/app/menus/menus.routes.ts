import { Routes } from '@angular/router';

export const menusRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'general',
        loadComponent: () =>
          import('./pages/general/menu-general.component').then(
            (m) => m.MenuGeneralComponent
          )
      },
      {
        path: '**',
        redirectTo: 'general'
      }
    ]
  }
];
