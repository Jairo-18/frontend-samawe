import { Routes } from '@angular/router';
import { DefaultLayoutComponent } from './default-layout/pages/default-layout/default-layout.component';
import { organizationalRoutes } from './organizational/organizational.routes';
import { adminGuard } from './shared/guards/admin.guard';
import { authGuard } from './shared/guards/auth.guard';

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
        canActivate: [authGuard, adminGuard],
        path: 'organizational',
        children: organizationalRoutes
      },
      {
        canActivate: [authGuard, adminGuard],
        path: 'service-and-product',
        loadChildren: () =>
          import('./service-and-product/service-and-product.routes').then(
            (m) => m.serviceAndProductRoutes
          )
      },
      {
        canActivate: [authGuard, adminGuard],
        path: 'invoices',
        loadChildren: () =>
          import('./invoices/invoices.routes').then((m) => m.invoicesRoutes)
      },
      {
        canActivate: [authGuard, adminGuard],
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
