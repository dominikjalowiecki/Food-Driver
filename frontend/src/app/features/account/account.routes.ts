import { Route } from '@angular/router';
import { AccountComponent } from './account.component';
import { roleGuard } from '../../core/guards/role.guard';
import { Roles } from '../../core/utils/roles.enum';
import { ChangePasswordComponent } from './features/change-password/change-password.component';
import { PersonalDataComponent } from './features/personal-data/personal-data.component';

export default [
  {
    path: '',
    component: AccountComponent,
    children: [
      {
        path: 'me',
        component: PersonalDataComponent,
      },
      {
        path: 'change-password',
        component: ChangePasswordComponent,
      },
      {
        path: 'user',
        loadChildren: () => import('./features/user/user.routes'),
        canActivate: [roleGuard],
        data: {
          roles: [Roles.Klient],
        },
      },
      {
        path: 'restaurant',
        loadChildren: () => import('./features/restaurant/restaurant.routes'),
        canActivate: [roleGuard],
        data: {
          roles: [Roles.Restaurator],
        },
      },
      {
        path: 'delivery',
        loadChildren: () => import('./features/delivery/delivery.routes'),
        canActivate: [roleGuard],
        data: {
          roles: [Roles.Dostawca],
        },
      },
      {
        path: 'admin',
        loadChildren: () => import('./features/admin/admin.routes'),
        canActivate: [roleGuard],
        data: {
          roles: [Roles.Administrator],
        },
      },
      {
        path: '',
        redirectTo: 'me',
        pathMatch: 'full',
      },
    ],
  },
] as Route[];
