import { Injectable, Signal, inject } from '@angular/core';
import { CreateOrderRequest, OrdersService } from '../../../shared/api';
import {
  Subject,
  catchError,
  delayWhen,
  filter,
  map,
  merge,
  of,
  shareReplay,
  switchMap,
  tap,
  timeout,
  timer,
} from 'rxjs';
import { HttpErrorsService } from '../../../shared/services/http-errors.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';

export interface RestaurantState {
  status: Signal<'success' | 'loading' | 'error' | null>;
}

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private router = inject(Router);
  private toast = inject(MessageService);
  private translateService = inject(TranslateService);
  private errorsService = inject(HttpErrorsService);
  private ordersService = inject(OrdersService);
  createOrder$ = new Subject<CreateOrderRequest>();
  private error$ = new Subject<Error>();
  private onCreateOrder$ = this.createOrder$.pipe(
    switchMap(data =>
      this.ordersService.createOrder(data).pipe(
        catchError((err: HttpErrorResponse) => {
          if (err.status === 201) return of(true);
          this.error$.next(err);
          this.errorsService.showErrorMessage(err);
          return of(undefined);
        })
      )
    ),
    filter(res => res !== undefined),
    tap(() => this.router.navigate(['/account/user/my-orders'])),
    tap(() =>
      this.toast.add({
        severity: 'success',
        summary: this.translateService.instant('global.success'),
        detail: this.translateService.instant('cart.success'),
      })
    ),
    shareReplay(1)
  );
  private status$ = merge(
    this.createOrder$.pipe(map(() => 'loading' as const)),
    this.onCreateOrder$.pipe(map(() => 'success' as const)),
    this.error$.pipe(map(() => 'error' as const))
  );
  private status = toSignal(this.status$, { initialValue: null });
  state: RestaurantState = {
    status: this.status,
  };
}
