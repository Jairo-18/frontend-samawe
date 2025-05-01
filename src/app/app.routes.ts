import { Routes } from '@angular/router';
import { DefaultLayoutComponent } from './default-layout/pages/default-layout/default-layout.component';
import { organizationalRoutes } from './organizational/organizational.routes';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: '',
    component: DefaultLayoutComponent,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./public/public.routes').then((m) => m.publicRoutes)
      },
      {
        path: 'auth',

        loadChildren: () =>
          import('./auth/auth.routes').then((m) => m.authRoutes)
      },
      {
        path: 'products',
        loadChildren: () =>
          import('./products/products.routes').then((m) => m.productsRoutes)
      },
      {
        path: 'organizational',
        children: organizationalRoutes
      },
      {
        path: 'invoices',
        loadChildren: () =>
          import('./invoices/invoices.routes').then((m) => m.invoicesRoutes)
      },
      {
        path: 'sales',
        loadChildren: () =>
          import('./sales/sales.routes').then((m) => m.salesRoutes)
      }
    ]
  },

  {
    path: '**',
    redirectTo: '/home'
  }
];
