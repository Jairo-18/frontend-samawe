import { Routes } from '@angular/router';
import { SeeUsersComponent } from './pages/see-users/see-users.component';
import { SeeTypesComponent } from './pages/see-types/see-types.component';
import { CreateOrEditUsersComponent } from './pages/create-or-edit-users/create-or-edit-users.component';
import { ApplicationManageComponent } from './pages/application-manage/application-manage.component';
import { FactusNumberingComponent } from './pages/factus-numbering/factus-numbering.component';
import { OrganizationsManageComponent } from './pages/organizations-manage/organizations-manage.component';
import { superAdminGuard } from '../shared/guards/super-admin.guard';
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
        path: 'application',
        component: ApplicationManageComponent
      },
      {
        path: 'numbering',
        component: FactusNumberingComponent
      },
      {
        path: 'organizations',
        canActivate: [superAdminGuard],
        component: OrganizationsManageComponent
      },
      {
        path: 'users',
        children: [
          {
            path: 'create',
            component: CreateOrEditUsersComponent
          },
          {
            path: 'list',
            component: SeeUsersComponent
          },
          {
            path: ':id/edit',
            component: CreateOrEditUsersComponent
          }
        ]
      },
      {
        path: 'types',
        children: [
          {
            path: 'manage',
            canActivate: [superAdminGuard],
            component: SeeTypesComponent
          }
        ]
      }
    ]
  }
];

