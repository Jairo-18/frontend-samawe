import { Routes } from '@angular/router';

export const productsRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'create-products',
        loadComponent: () =>
          import('./pages/create-products/create-products.component').then(
            (m) => m.CreateProductsComponent
          )
      },
      {
        path: 'see-products',
        loadComponent: () =>
          import('./pages/see-products/see-products.component').then(
            (m) => m.SeeProductsComponent
          )
      }
    ]
  }
];
