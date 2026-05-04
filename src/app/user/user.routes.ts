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
    path: '',
    pathMatch: 'full',
    redirectTo: 'profile'
  },
  {
    path: '**',
    redirectTo: 'profile'
  }
];
