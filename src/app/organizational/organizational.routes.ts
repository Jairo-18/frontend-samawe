import { Routes } from '@angular/router';

export const organizationalRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'create-users',
        loadComponent: () =>
          import('./pages/create-users/create-users.component').then(
            (m) => m.CreateUsersComponent
          )
      },
      {
        path: 'see-users',
        loadComponent: () =>
          import('./pages/see-users/see-users.component').then(
            (m) => m.SeeUsersComponent
          )
      }
    ]
  }
];
