import { Routes } from '@angular/router';

// Importaciones estáticas de los componentes
import { CreateUsersOrEditUsersComponent } from './pages/create-users-or-edit-users/create-users-or-edit-users.component';
import { SeeUsersComponent } from './pages/see-users/see-users.component';
import { CreateOrEditTypesComponent } from './pages/create-or-edit-types/create-or-edit-types.component';

export const organizationalRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        redirectTo: '/home',
        pathMatch: 'full'
      },
      {
        path: 'users',
        children: [
          {
            path: 'create',
            component: CreateUsersOrEditUsersComponent // Carga estática
          },
          {
            path: 'list',
            component: SeeUsersComponent // Carga estática
          },
          {
            path: ':id/edit',
            component: CreateUsersOrEditUsersComponent // Carga estática
          }
        ]
      },
      {
        path: 'types',
        children: [
          {
            path: 'manage',
            component: CreateOrEditTypesComponent
          }
        ]
      }
    ]
  }
];
