import { isLoggedGuard } from './shared/guards/isLogged.guard';
import { Routes } from '@angular/router';
import { DefaultLayoutComponent } from './default-layout/pages/default-layout/default-layout.component';

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
        canActivate: [isLoggedGuard],
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
        loadChildren: () =>
          import('./organizational/organizational.routes').then(
            (m) => m.organizationalRoutes
          )
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
