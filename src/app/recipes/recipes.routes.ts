import { Routes } from '@angular/router';

export const recipesRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'general',
        loadComponent: () =>
          import('./pages/general/general.component').then(
            (m) => m.RecipesGeneralComponent
          )
      },
      {
        path: '**',
        redirectTo: 'general'
      }
    ]
  }
];

