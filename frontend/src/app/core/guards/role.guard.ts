import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { JwtService } from '../../shared/services/jwt.service';
import { Roles } from '../utils/roles.enum';

export const roleGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const jwtService = inject(JwtService);
  const roles = route.data['roles'] as Roles[];
  const userRole = jwtService.getRole();
  return roles.includes(userRole) ? true : router.parseUrl('/');
};
