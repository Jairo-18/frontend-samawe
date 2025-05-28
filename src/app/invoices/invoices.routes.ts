import { Routes } from '@angular/router';
import { CreateInvoicesComponent } from './pages/create-invoices/create-invoices.component';
import { SeeInvoicesComponent } from './pages/see-invoices/see-invoices.component';

export const invoicesRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        redirectTo: '/home',
        pathMatch: 'full'
      },
      {
        path: 'invoices',
        children: [
          {
            path: 'create',
            component: CreateInvoicesComponent
          },
          {
            path: 'list',
            component: SeeInvoicesComponent
          }
        ]
      }
    ]
  }
];
