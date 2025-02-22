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
} from 'rxjs';
import { SignUpRequest, UsersService } from '../../../shared/api';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpErrorsService } from '../../../shared/services/http-errors.service';
export interface SignUpState {
  status: Signal<'success' | 'loading' | 'error' | null>;
  error: Signal<string | null>;
}

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private errorsService = inject(HttpErrorsService);
  private usersSerivce = inject(UsersService);
  private error$ = new Subject<Error>();
  signUp$ = new Subject<SignUpRequest>();

  private onSignUp$ = this.signUp$.pipe(
    switchMap(data =>
      this.usersSerivce.signUp(data).pipe(
        catchError((err: HttpErrorResponse) => {
          this.error$.next(err);
          this.errorsService.showErrorMessage(err);
          return of(undefined);
        })
      )
    ),
    shareReplay(1)
  );
  private status$ = merge(
    this.signUp$.pipe(map(() => 'loading' as const)),
    this.onSignUp$.pipe(
      filter(res => res !== undefined),
      map(() => 'success' as const)
    ),
    this.error$.pipe(map(() => 'error' as const))
  );
  private status = toSignal(this.status$, { initialValue: null });
  private error = toSignal(this.error$.pipe(map(err => err.message)), {
    initialValue: null,
  });

  state: SignUpState = {
    status: this.status,
    error: this.error,
  };
}
