import { Routes } from '@angular/router';

export const userRoutes: Routes = [
  {
    path: 'profile',
    loadComponent: () =>
      import('./pages/profile/profile.component').then(
        (m) => m.ProfileComponent
      )
  },
  {
    path: 'invoices/:id',
    loadComponent: () =>
      import('./pages/invoice-detail/invoice-detail.component').then(
        (m) => m.InvoiceDetailComponent
      )
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'profile'
  },
  {
    path: '**',
    redirectTo: 'profile'
  }
];
