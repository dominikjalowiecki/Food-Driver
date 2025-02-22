import { Injectable, Signal, inject } from '@angular/core';
import { UsersService } from '../../../shared/api';
import {
  Subject,
  catchError,
  filter,
  map,
  merge,
  of,
  shareReplay,
  startWith,
  switchMap,
  timeout,
} from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';

export interface ActivateAccountState {
  status: Signal<'success' | 'error' | 'loading'>;
}

@Injectable()
export class DataService {
  private usersService = inject(UsersService);
  private route = inject(ActivatedRoute);
  private error$ = new Subject<Error>();
  private activateAccount$ = this.usersService
    .activateAccount({
      token: this.route.snapshot.paramMap.get('token') as string,
    })
    .pipe(
      catchError((err: HttpErrorResponse) => {
        this.error$.next(err);
        return of(undefined);
      })
    );
  private status$ = merge(
    this.activateAccount$.pipe(
      filter(res => res !== undefined),
      map(() => 'success' as const)
    ),
    this.error$.pipe(map(() => 'error' as const))
  ).pipe(startWith('loading' as const));
  private status = toSignal(this.status$, { initialValue: 'loading' as const });
  state: ActivateAccountState = {
    status: this.status,
  };
}
