import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { JwtService } from '../../shared/services/jwt.service';

export const authGuard: CanActivateFn = (route, state) => {
  const jwtService = inject(JwtService);
  const router = inject(Router);
  return jwtService.checkToken() ? true : router.parseUrl('/');
};
