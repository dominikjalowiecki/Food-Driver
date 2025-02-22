import { Injectable, Signal, inject } from '@angular/core';
import { ChangePasswordRequest, UsersService } from '../../../../../shared/api';
import { Subject, catchError, filter, map, merge, of, switchMap } from 'rxjs';
import { HttpErrorsService } from '../../../../../shared/services/http-errors.service';
import { toSignal } from '@angular/core/rxjs-interop';

export interface ChangePasswordState {
  status: Signal<'success' | 'loading' | 'error' | null>;
}

@Injectable()
export class DataService {
  private usersApiService = inject(UsersService);
  private errorsService = inject(HttpErrorsService);
  private error$ = new Subject<Error>();
  changePassword$ = new Subject<ChangePasswordRequest>();

  private onChangePassword$ = this.changePassword$.pipe(
    switchMap(data =>
      this.usersApiService.changePassword(data).pipe(
        catchError(err => {
          this.error$.next(err);
          this.errorsService.showErrorMessage(err);
          return of(undefined);
        })
      )
    )
  );
  private status$ = merge(
    this.changePassword$.pipe(map(() => 'loading' as const)),
    this.onChangePassword$.pipe(
      filter(res => res !== undefined),
      map(() => 'success' as const)
    ),
    this.error$.pipe(map(() => 'error' as const))
  );

  private status = toSignal(this.status$, { initialValue: null });

  state: ChangePasswordState = {
    status: this.status,
  };
}
