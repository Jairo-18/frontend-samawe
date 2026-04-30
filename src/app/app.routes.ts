import { inject } from '@angular/core';
import { Routes, Router } from '@angular/router';
import { LangService } from './shared/services/lang.service';
import { DefaultLayoutComponent } from './default-layout/pages/default-layout/default-layout.component';
import { organizationalRoutes } from './organizational/organizational.routes';
import { adminGuard } from './shared/guards/admin.guard';
import { authGuard } from './shared/guards/auth.guard';
import { invoicesRoutes } from './invoices/invoices.routes';
import { isLoggedGuard } from './shared/guards/isLogged.guard';
import { pendingProfileGuard } from './shared/guards/pending-profile.guard';
import { langGuard } from './shared/guards/lang.guard';

const publicChildren = () =>
  import('./public/public.routes').then((m) => m.publicRoutes);

const sharedLangChildren: Routes = [
  {
    path: 'auth',
    canActivate: [isLoggedGuard],
    loadChildren: () => import('./auth/auth.routes').then((m) => m.authRoutes)
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
  },
  {
    path: 'user',
    canActivate: [authGuard],
    loadChildren: () => import('./user/user.routes').then((m) => m.userRoutes)
  }
];

export const routes: Routes = [
  { path: 'nosotros', redirectTo: '/es/about-us', pathMatch: 'full' },
  { path: 'paquetes', redirectTo: '/es/accommodation', pathMatch: 'full' },
  { path: 'samawe-1', redirectTo: '/es/accommodation', pathMatch: 'full' },
  { path: 'excursion', redirectTo: '/es/how-to-arrive', pathMatch: 'full' },
  { path: 'home', redirectTo: () => `/${inject(LangService).detectPreferred()}`, pathMatch: 'full' },
  { path: 'accommodation', redirectTo: '/es/accommodation', pathMatch: 'full' },
  { path: 'about-us', redirectTo: '/es/about-us', pathMatch: 'full' },
  { path: 'gastronomy', redirectTo: '/es/gastronomy', pathMatch: 'full' },
  { path: 'how-to-arrive', redirectTo: '/es/how-to-arrive', pathMatch: 'full' },
  { path: 'blog', redirectTo: '/es/blog', pathMatch: 'full' },

  { path: '', redirectTo: () => `/${inject(LangService).detectPreferred()}`, pathMatch: 'full' },

  {
    path: 'es',
    component: DefaultLayoutComponent,
    canActivate: [langGuard],
    data: { lang: 'es' },
    children: [
      { path: '', loadChildren: publicChildren },
      ...sharedLangChildren
    ]
  },

  {
    path: 'en',
    component: DefaultLayoutComponent,
    canActivate: [langGuard],
    data: { lang: 'en' },
    children: [
      { path: '', loadChildren: publicChildren },
      ...sharedLangChildren
    ]
  },

  {
    path: '',
    component: DefaultLayoutComponent,
    children: [
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
        path: 'test',
        loadChildren: () =>
          import('./test/test.routes').then((m) => m.testRoutes)
      },
      {
        path: 'settings',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./public/pages/settings/settings.component').then(
            (m) => m.SettingsComponent
          )
      }
    ]
  },

  {
    path: 'auth/google/callback',
    loadComponent: () =>
      import('./auth/pages/google-callback/google-callback.component').then(
        (m) => m.GoogleCallbackComponent
      )
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        redirectTo: (route) => {
          const router = inject(Router);
          const lang = inject(LangService).detectPreferred();
          return router.createUrlTree([`/${lang}/auth/login`], { queryParams: route.queryParams });
        },
        pathMatch: 'full'
      },
      {
        path: 'register',
        redirectTo: (route) => {
          const router = inject(Router);
          const lang = inject(LangService).detectPreferred();
          return router.createUrlTree([`/${lang}/auth/register`], { queryParams: route.queryParams });
        },
        pathMatch: 'full'
      },
      {
        path: 'verify-email',
        redirectTo: (route) => {
          const router = inject(Router);
          const lang = inject(LangService).detectPreferred();
          return router.createUrlTree([`/${lang}/auth/verify-email`], { queryParams: route.queryParams });
        },
        pathMatch: 'full'
      },
      {
        path: 'recovery-password',
        redirectTo: (route) => {
          const router = inject(Router);
          const lang = inject(LangService).detectPreferred();
          return router.createUrlTree([`/${lang}/auth/recovery-password`], { queryParams: route.queryParams });
        },
        pathMatch: 'full'
      },
      {
        path: ':userId/change-password',
        redirectTo: (route) => {
          const router = inject(Router);
          const lang = inject(LangService).detectPreferred();
          return router.createUrlTree(
            [`/${lang}/auth`, route.params['userId'], 'change-password'],
            { queryParams: route.queryParams }
          );
        },
        pathMatch: 'full'
      }
    ]
  },
  { path: '**', redirectTo: () => `/${inject(LangService).detectPreferred()}` }
];
