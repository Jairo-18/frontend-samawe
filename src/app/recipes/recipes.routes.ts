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
        path: 'restaurant-order',
        loadComponent: () =>
          import('./pages/restaurant-order/restaurant-order.component').then(
            (m) => m.RestaurantOrderComponent
          )
      },
      {
        path: 'restaurant-order/:id/edit',
        loadComponent: () =>
          import('./pages/edit-order/edit-order.component').then(
            (m) => m.EditOrderComponent
          )
      },
      {
        path: '**',
        redirectTo: 'general'
      }
    ]
  }
];
