import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { alreadyLoggedInGuard } from './core/guards/alreadyLoggedIn.guard';
import { roleGuard } from './core/guards/role.guard';
import { Roles } from './core/utils/roles.enum';

export const routes: Routes = [
  {
    path: 'orders/:id',
    loadChildren: () => import('./features/orders/orders.routes'),
    canActivate: [authGuard, roleGuard],
    data: {
      roles: [
        Roles.Klient,
        Roles.Restaurator,
        Roles.Dostawca,
        Roles.Administrator,
      ],
    },
  },
  {
    path: 'restaurants',
    loadChildren: () => import('./features/restaurants/restaurants.routes'),
  },
  {
    path: 'sign-up',
    loadChildren: () => import('./features/sign-up/sign-up.routes'),
    canActivate: [alreadyLoggedInGuard],
  },
  {
    path: 'account',
    loadChildren: () => import('./features/account/account.routes'),
    canActivate: [authGuard],
  },
  {
    path: 'activate/:token',
    loadComponent: () =>
      import('./features/activate-account/activate-account.component').then(
        c => c.ActivateAccountComponent
      ),
    canActivate: [alreadyLoggedInGuard],
  },
  {
    path: 'reset-password/confirm/:token',
    loadComponent: () =>
      import('./features/reset-password/reset-password.component').then(
        c => c.ResetPasswordComponent
      ),
    canActivate: [alreadyLoggedInGuard],
  },
  {
    path: 'forbidden-access',
    loadComponent: () =>
      import('./features/forbidden-access/forbidden-access.component').then(
        c => c.ForbiddenAccessComponent
      ),
  },
  {
    path: '',
    loadComponent: () =>
      import('./features/map/map.component').then(c => c.MapComponent),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then(
        c => c.NotFoundComponent
      ),
  },
];
