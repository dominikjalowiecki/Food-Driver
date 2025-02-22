import { Injectable, Signal, inject, signal } from '@angular/core';
import { GetMe200Response, UsersService } from '../../shared/api';
import { AuthService } from './auth.service';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  Subject,
  catchError,
  filter,
  map,
  of,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs';

export interface UserState {
  user: Signal<GetMe200Response | null>;
  status: Signal<'loaded' | 'empty' | null>;
  error: Signal<string | null>;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private authService = inject(AuthService);
  private usersService = inject(UsersService);
  private error$ = new Subject<Error>();

  private _user = signal<GetMe200Response | null>(null);
  private user$ = toObservable(this.authService.state.status).pipe(
    switchMap(status => {
      if (status === 'logged-in') {
        return this.usersService.getMe().pipe(
          tap(user => this._user.set(user)),
          catchError(err => {
            this.error$.next(err);
            return of(null);
          })
        );
      }
      this._user.set(null);
      return of(null);
    }),
    shareReplay(1)
  );
  private status$ = this.user$.pipe(map(res => (res ? 'loaded' : 'empty')));
  private user = this._user.asReadonly();
  private status = toSignal(this.status$, { initialValue: null });
  private error = toSignal(this.error$.pipe(map(err => err.message)), {
    initialValue: null,
  });
  state: UserState = {
    user: this.user,
    status: this.status,
    error: this.error,
  };

  setUser(user: GetMe200Response) {
    this._user.set(user);
  }
}
