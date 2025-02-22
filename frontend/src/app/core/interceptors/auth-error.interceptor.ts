import type {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, of, switchMap, tap, throwError } from 'rxjs';
import { AuthService } from '../data-access/auth.service';
import { HttpErrorsService } from '../../shared/services/http-errors.service';
import { JwtService } from '../../shared/services/jwt.service';
import { UsersService } from '../../shared/api';
import { Router } from '@angular/router';

export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const usersApiService = inject(UsersService);
  const authService = inject(AuthService);
  const jwtService = inject(JwtService);
  const errorService = inject(HttpErrorsService);
  const router = inject(Router);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status == 403) {
        router.navigate(['/forbidden-access']);
      }
      if (err.status === 401 && jwtService.checkRefreshToken()) {
        const refreshToken = jwtService.getRefreshToken();
        return usersApiService.refreshTokens({ refreshToken }).pipe(
          switchMap(({ authenticationToken, refreshToken }) => {
            jwtService.setToken(authenticationToken);
            jwtService.setRefreshToken(refreshToken);
            const newReq = req.clone({
              headers: req.headers.set(
                'Authorization',
                `Bearer ${authenticationToken}`
              ),
            });
            return next(newReq);
          }),
          catchError((err: HttpErrorResponse) => {
            errorService.showErrorMessage(err);
            authService.logout$.next();
            return throwError(() => err);
          })
        );
      }
      return throwError(() => err);
    })
  );
};
