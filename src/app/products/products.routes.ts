import { Routes } from '@angular/router';
import { CreateProductsOrEditProductsComponent } from './pages/create-products-or-edit-products/create-products-or-edit-products.component';
import { SeeProductsComponent } from './pages/see-products/see-products.component';

export const productsRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        redirectTo: '/home',
        pathMatch: 'full'
      },
      {
        path: 'product',
        children: [
          {
            path: 'create',
            component: CreateProductsOrEditProductsComponent // Carga estática
          },
          {
            path: 'list',
            component: SeeProductsComponent // Carga estática
          },
          {
            path: ':id/edit',
            component: CreateProductsOrEditProductsComponent // Carga estática
          }
        ]
      }
    ]
  }
];
