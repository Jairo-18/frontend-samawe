import { Routes } from '@angular/router';

export const invoicesRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'create-invoices',
        loadComponent: () =>
          import('./pages/create-invoices/create-invoices.component').then(
            (m) => m.CreateInvoicesComponent
          )
      },
      {
        path: 'see-invoices',
        loadComponent: () =>
          import('./pages/see-invoices/see-invoices.component').then(
            (m) => m.SeeInvoicesComponent
          )
      }
    ]
  }
];
