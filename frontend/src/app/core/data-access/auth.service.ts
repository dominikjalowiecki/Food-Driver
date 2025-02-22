import { Injectable, Signal, inject } from '@angular/core';
import {
  Subject,
  catchError,
  filter,
  map,
  merge,
  of,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs';
import {
  ResetPasswordRequest,
  SignInRequest,
  TokensPair,
  UsersService,
} from '../../shared/api';
import { toSignal } from '@angular/core/rxjs-interop';
import { JwtService } from '../../shared/services/jwt.service';
import { Router } from '@angular/router';
import { HttpErrorsService } from '../../shared/services/http-errors.service';

export interface AuthState {
  status: Signal<
    'logged-in' | 'password-reset-send' | 'logged-out' | 'loading' | 'error'
  >;
  error: Signal<string | null>;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private errorsService = inject(HttpErrorsService);
  private usersService = inject(UsersService);
  private jwtService = inject(JwtService);
  private router = inject(Router);
  resetPassword$ = new Subject<ResetPasswordRequest>();
  login$ = new Subject<SignInRequest>();
  logout$ = new Subject<void>();
  private error$ = new Subject<Error>();
  private onLogout$ = this.logout$.pipe(
    tap(() => {
      this.jwtService.removeToken();
      this.jwtService.removeRefreshToken();
    }),
    tap(() => this.router.navigate(['/']))
  );
  private onLogin$ = this.login$.pipe(
    switchMap(credentials =>
      this.usersService.signIn(credentials).pipe(
        catchError(err => {
          this.error$.next(err);
          this.errorsService.showErrorMessage(err);
          return of(undefined);
        })
      )
    ),
    filter(res => res !== undefined),
    map(res => res as TokensPair),
    tap(({ authenticationToken, refreshToken }) => {
      this.jwtService.setToken(authenticationToken);
      this.jwtService.setRefreshToken(refreshToken);
    }),
    tap(() => this.router.navigate(['/account/me'])),
    shareReplay(1)
  );
  private onResetPassword$ = this.resetPassword$.pipe(
    switchMap(data =>
      this.usersService.resetPassword(data).pipe(
        catchError(err => {
          this.error$.next(err);
          this.errorsService.showErrorMessage(err);
          return of(undefined);
        })
      )
    )
  );
  private status$ = merge(
    merge(this.login$, this.resetPassword$).pipe(map(() => 'loading' as const)),
    this.onLogin$.pipe(
      filter(res => res !== undefined),
      map(() => 'logged-in' as const)
    ),
    this.onResetPassword$.pipe(
      filter(res => res !== undefined),
      map(() => 'password-reset-send' as const)
    ),
    this.onLogout$.pipe(map(() => 'logged-out' as const)),
    this.error$.pipe(map(() => 'error' as const))
  );

  private status = toSignal(this.status$, {
    initialValue: this.jwtService.getToken() ? 'logged-in' : 'logged-out',
  });
  private error = toSignal(this.error$.pipe(map(err => err.message)), {
    initialValue: null,
  });
  state: AuthState = {
    status: this.status,
    error: this.error,
  };
}
