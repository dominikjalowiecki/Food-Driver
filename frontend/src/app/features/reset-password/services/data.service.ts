import { Injectable, Signal, inject } from '@angular/core';
import { ResetPasswordConfirmRequest, UsersService } from '../../../shared/api';
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
import { HttpErrorsService } from '../../../shared/services/http-errors.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { MessageService } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';

export interface ResetPasswordState {
  status: Signal<'success' | 'error' | 'loading' | null>;
}

@Injectable()
export class DataService {
  private usersApiService = inject(UsersService);
  private errorsService = inject(HttpErrorsService);
  private translateService = inject(TranslateService);
  private router = inject(Router);
  private toast = inject(MessageService);
  resetPasswordConfirm$ = new Subject<ResetPasswordConfirmRequest>();
  private error$ = new Subject<Error>();
  private onResetPasswordConfirm$ = this.resetPasswordConfirm$.pipe(
    switchMap(data =>
      this.usersApiService.resetPasswordConfirm(data).pipe(
        catchError(err => {
          this.error$.next(err);
          this.errorsService.showErrorMessage(err);
          return of(undefined);
        })
      )
    ),
    filter(res => res !== undefined),
    tap(() => this.router.navigate(['/'])),
    tap(() =>
      this.toast.add({
        summary: this.translateService.instant('global.success'),
        detail: this.translateService.instant('passwordReset.success'),
        severity: 'success',
      })
    ),
    shareReplay(1)
  );
  private status$ = merge(
    this.resetPasswordConfirm$.pipe(map(() => 'loading' as const)),
    this.onResetPasswordConfirm$.pipe(map(() => 'success' as const)),
    this.error$.pipe(map(() => 'error' as const))
  );
  private status = toSignal(this.status$, { initialValue: null });
  state: ResetPasswordState = {
    status: this.status,
  };
}
