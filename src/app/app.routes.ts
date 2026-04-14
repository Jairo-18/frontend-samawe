import { Routes } from '@angular/router';
import { DefaultLayoutComponent } from './default-layout/pages/default-layout/default-layout.component';
import { organizationalRoutes } from './organizational/organizational.routes';
import { adminGuard } from './shared/guards/admin.guard';
import { authGuard } from './shared/guards/auth.guard';
import { invoicesRoutes } from './invoices/invoices.routes';
import { isLoggedGuard } from './shared/guards/isLogged.guard';
import { pendingProfileGuard } from './shared/guards/pending-profile.guard';
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
        path: 'recipes',
        loadChildren: () =>
          import('./recipes/recipes.routes').then((m) => m.recipesRoutes)
      },
      {
        canActivate: [authGuard, adminGuard],
        path: 'menus',
        loadChildren: () =>
          import('./menus/menus.routes').then((m) => m.menusRoutes)
      },
      {
        canActivate: [authGuard, adminGuard],
        path: 'invoice',
        children: invoicesRoutes
      },
      {
        canActivate: [authGuard, adminGuard],
        path: 'sales',
        loadChildren: () =>
          import('./sales/sales.routes').then((m) => m.salesRoutes)
      },
      {
        canActivate: [authGuard],
        path: 'user',
        loadChildren: () =>
          import('./user/user.routes').then((m) => m.userRoutes)
      },
      {
        path: 'test',
        loadChildren: () =>
          import('./test/test.routes').then((m) => m.testRoutes)
      },
      {
        path: 'auth/:userId/change-password',
        loadComponent: () =>
          import('./auth/pages/change-password/change-password.component').then(
            (m) => m.ChangePasswordComponent
          )
      },
      {
        path: 'complete-profile',
        canActivate: [pendingProfileGuard],
        loadComponent: () =>
          import('./auth/pages/complete-profile/complete-profile.component').then(
            (m) => m.CompleteProfileComponent
          )
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/home'
  }
];
