import { Injectable, Signal, inject } from '@angular/core';
import { UsersService } from '../../shared/api';
import { AuthService } from './auth.service';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
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
  tap,
} from 'rxjs';
import { HttpErrorsService } from '../../shared/services/http-errors.service';
import { SwPush } from '@angular/service-worker';
import { environment } from '../../../environments/environment.development';

export interface PushNotificationsState {
  status: Signal<'success' | 'loading' | 'error' | null>;
}

@Injectable({
  providedIn: 'root',
})
export class PushNotificationsService {
  private swPush = inject(SwPush);
  private usersApiServices = inject(UsersService);
  private errrosService = inject(HttpErrorsService);
  private authService = inject(AuthService);
  private error$ = new Subject<Error>();
  private subscribePushNotifications$ = toObservable(
    this.authService.state.status
  ).pipe(
    filter(status => status === 'logged-in'),
    switchMap(() =>
      this.swPush.requestSubscription({
        serverPublicKey: environment.publicVapidKey,
      })
    ),
    switchMap(sub =>
      this.usersApiServices.subscribePushNotifications(sub).pipe(
        catchError(err => {
          this.errrosService.showErrorMessage(err);
          this.error$.next(err);
          return of(undefined);
        })
      )
    ),
    shareReplay(1)
  );

  private status$ = merge(
    this.subscribePushNotifications$.pipe(
      filter(res => res !== undefined),
      map(() => 'success' as const)
    )
  );
  private status = toSignal(this.status$, { initialValue: null });
  state: PushNotificationsState = {
    status: this.status,
  };
}
