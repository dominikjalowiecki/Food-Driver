import { Injectable, Signal, inject } from '@angular/core';
import {
  CategoriesService,
  GetMeRestaurant200Response,
  ListMeOrders200ResponseResultsInnerRestaurantCategory,
  UsersService,
} from '../../../../../../../shared/api';
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
import { HttpErrorsService } from '../../../../../../../shared/services/http-errors.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { RestaurantData } from '../dto/restaurant-data';
import { RestaurantService } from '../../../services/restaurant.service';

export interface MyRestaurantState {
  categories: Signal<
    ListMeOrders200ResponseResultsInnerRestaurantCategory[] | undefined
  >;
  restaurant: Signal<GetMeRestaurant200Response | undefined>;
  status: Signal<'completed' | 'updated' | 'loading' | 'error' | null>;
}

@Injectable({ providedIn: 'root' })
export class DataService {
  private restaurantService = inject(RestaurantService);
  private categoriesApiService = inject(CategoriesService);
  private usersApiService = inject(UsersService);
  private errorsService = inject(HttpErrorsService);
  private error$ = new Subject<Error>();
  private restaurant = this.restaurantService.state.restaurant;
  updateRestaurant$ = new Subject<RestaurantData>();
  private onUpdateRestaurant$ = this.updateRestaurant$.pipe(
    switchMap(data => {
      const { category } = data;
      return this.usersApiService
        .updateMeRestaurant({
          ...data,
          idCategory: category.idCategory,
        })
        .pipe(
          tap(() => this.restaurantService.updateRestaurant$.next(data)),
          catchError(err => {
            this.error$.next(err);
            this.errorsService.showErrorMessage(err);
            return of(undefined);
          })
        );
    }),
    shareReplay(1)
  );
  private categories$ = this.categoriesApiService.listCategories().pipe(
    catchError(err => {
      this.error$.next(err);
      this.errorsService.showErrorMessage(err);
      return of(undefined);
    }),
    shareReplay(1)
  );

  private status$ = merge(
    this.updateRestaurant$.pipe(map(() => 'loading' as const)),
    this.onUpdateRestaurant$.pipe(
      filter(res => res !== undefined),
      map(() => 'updated' as const)
    ),
    this.categories$.pipe(
      filter(res => res !== undefined),
      map(() => 'completed' as const)
    ),
    this.error$.pipe(map(() => 'error' as const))
  );
  private categories = toSignal(this.categories$, { initialValue: undefined });
  private status = toSignal(this.status$, { initialValue: 'loading' as const });
  state: MyRestaurantState = {
    categories: this.categories,
    restaurant: this.restaurant,
    status: this.status,
  };
}
