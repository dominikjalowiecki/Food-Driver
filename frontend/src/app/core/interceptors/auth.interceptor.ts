import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { JwtService } from '../../shared/services/jwt.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const jwtService = inject(JwtService);
  const token = jwtService.getToken();
  if (!token) return next(req);
  const newReq = req.clone({
    headers: req.headers.set('Authorization', `Bearer ${token}`),
  });
  return next(newReq);
};
