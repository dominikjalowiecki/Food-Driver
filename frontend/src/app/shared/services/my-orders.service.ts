import { Injectable, Signal, inject } from '@angular/core';
import {
  ListMeOrders200Response,
  OrderStatus,
  OrdersService,
  UsersService,
} from '../api';
import {
  Observable,
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
  withLatestFrom,
} from 'rxjs';
import { HttpErrorsService } from './http-errors.service';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { OrdersFilters } from '../ui/orders-filters/interfaces/orders-filters';
import { AuthService } from '../../core/data-access/auth.service';
import { JwtService } from './jwt.service';
import { Roles } from '../../core/utils/roles.enum';

export interface MyOrdersState {
  filters: Signal<OrdersFilters>;
  orders: Signal<ListMeOrders200Response | undefined>;
  status: Signal<'completed' | 'loading' | 'error'>;
}

@Injectable({ providedIn: 'root' })
export class MyOrdersService {
  private authService = inject(AuthService);
  private jwtService = inject(JwtService);
  private usersApiService = inject(UsersService);
  private errorsService = inject(HttpErrorsService);
  private error$ = new Subject<Error>();
  private authStatus$ = toObservable(this.authService.state.status);
  private source$ = (filters: OrdersFilters) =>
    this.authStatus$.pipe(
      filter(status => status === 'logged-in'),
      switchMap(() => {
        const query = this.getSourceQuery(filters);
        return query ? query : of(undefined);
      })
    );
  filter$ = new Subject<OrdersFilters>();
  refresh$ = new Subject<void>();
  private initFilters$ = of({
    status: OrderStatus.Nowe,
    reported: false,
    page: 0,
  } as OrdersFilters);
  private filters$ = merge(this.filter$, this.initFilters$).pipe(
    shareReplay(1)
  );
  private orders$ = merge(
    this.refresh$.pipe(switchMap(() => this.filters$)),
    this.filters$
  ).pipe(
    switchMap(filters => {
      return this.source$(filters);
    }),
    shareReplay(1)
  );
  private status$: Observable<'completed' | 'loading' | 'error'> = merge(
    this.orders$.pipe(
      filter(res => res !== undefined),
      map(() => 'completed' as const)
    ),
    this.error$.pipe(map(() => 'error' as const))
  );
  private filters = toSignal(this.filters$, {
    initialValue: {
      status: OrderStatus.Nowe,
      reported: false,
      page: 0,
    } as OrdersFilters,
  });
  private orders = toSignal(this.orders$, { initialValue: undefined });
  private status = toSignal(this.status$, { initialValue: 'loading' as const });
  state: MyOrdersState = {
    filters: this.filters,
    orders: this.orders,
    status: this.status,
  };

  private getSourceQuery(filters: OrdersFilters) {
    let query;
    switch (this.jwtService.getRole()) {
      case Roles.Klient:
        query = this.usersApiService.listMeOrders(
          filters.status,
          filters.reported,
          (filters.page || 0) + 1
        );
        break;
      case Roles.Dostawca:
        query = this.usersApiService.listMeDeliveries(
          filters.status,
          filters.reported,
          (filters.page || 0) + 1
        );
        break;
      case Roles.Restaurator:
        query = this.usersApiService.listMeRestaurantOrders(
          filters.status,
          filters.reported,
          (filters.page || 0) + 1
        );
        break;
    }
    if (!query) return of(undefined);
    return query.pipe(
      catchError(err => {
        this.error$.next(err);
        this.errorsService.showErrorMessage(err);
        return of(undefined);
      })
    );
  }
}
