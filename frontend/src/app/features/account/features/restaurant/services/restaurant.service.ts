import { Injectable, Signal, inject, signal } from '@angular/core';
import {
  GetMeRestaurant200Response,
  GetMeRestaurant200ResponseMenuInner,
  UsersService,
} from '../../../../../shared/api';
import {
  Observable,
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
import { HttpErrorsService } from '../../../../../shared/services/http-errors.service';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../../../core/data-access/auth.service';
import { Roles } from '../../../../../core/utils/roles.enum';
import { JwtService } from '../../../../../shared/services/jwt.service';

export interface RestaurantState {
  restaurant: Signal<GetMeRestaurant200Response | undefined>;
  status: Signal<'completed' | 'loading' | 'error'>;
}

@Injectable({ providedIn: 'root' })
export class RestaurantService {
  private jwtService = inject(JwtService);
  private authService = inject(AuthService);
  private errorsService = inject(HttpErrorsService);
  private usersApiService = inject(UsersService);
  private error$ = new Subject<Error>();
  private restaurantState = signal<GetMeRestaurant200Response | undefined>(
    undefined
  );
  reloadRestaurant$ = new Subject<void>();
  updateRestaurant$ = new Subject<Partial<GetMeRestaurant200Response>>();
  private onReloadRestaurant$ = merge(
    this.reloadRestaurant$,
    this.updateRestaurant$
  ).pipe(switchMap(() => this.initialRestaurant$));
  private initialRestaurant$ = toObservable(this.authService.state.status).pipe(
    switchMap(() =>
      this.jwtService.getRole() === Roles.Restaurator
        ? this.usersApiService.getMeRestaurant().pipe(
            tap(restaurant => this.restaurantState.set(restaurant)),
            catchError(err => {
              this.error$.next(err);
              this.errorsService.showErrorMessage(err);
              return of(undefined);
            })
          )
        : of(undefined)
    )
  );
  private status$: Observable<'completed' | 'loading' | 'error'> = merge(
    merge(this.initialRestaurant$, this.onReloadRestaurant$).pipe(
      filter(res => res !== undefined),
      map(() => 'completed' as const)
    ),
    this.error$.pipe(map(() => 'error' as const))
  );
  private restaurant = this.restaurantState.asReadonly();
  private status = toSignal(this.status$, { initialValue: 'loading' });
  state: RestaurantState = {
    restaurant: this.restaurant,
    status: this.status,
  };
}
