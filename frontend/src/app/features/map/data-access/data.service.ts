import { Injectable, Signal, inject } from '@angular/core';
import {
  CategoriesService,
  DeliveriesService,
  ListMeOrders200Response,
  ListMeOrders200ResponseResultsInnerRestaurantCategory,
  ListRestaurants200Response,
  OrdersService,
  RestaurantsService,
} from '../../../shared/api';
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
} from 'rxjs';
import {
  ListOrdersParams,
  ListRestaurantsParams,
} from '../interfaces/list-restaurants-params';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorsService } from '../../../shared/services/http-errors.service';

export interface MapState {
  orders: Signal<ListMeOrders200Response | undefined>;
  categories: Signal<ListMeOrders200ResponseResultsInnerRestaurantCategory[]>;
  options: Signal<google.maps.MapOptions>;
  restaurants: Signal<ListRestaurants200Response | undefined>;
  status: Signal<'success' | 'loading' | 'error' | null>;
  error: Signal<string | null>;
}

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private errorsService = inject(HttpErrorsService);
  private deliveriesApiService = inject(DeliveriesService);
  private restaurantsService = inject(RestaurantsService);
  private categoriesService = inject(CategoriesService);
  resetLocalization$ = new Subject<void>();
  getRestaurants$ = new Subject<ListRestaurantsParams>();
  getDeliveries$ = new Subject<ListOrdersParams>();
  private error$ = new Subject<Error>();
  private readonly defaultWarsawCoordinates: google.maps.LatLngLiteral = {
    lat: 52.229827082,
    lng: 21.011731518,
  };
  private currentCoordinates$ = merge(
    new Observable<google.maps.LatLngLiteral>(obs =>
      navigator.geolocation.getCurrentPosition(resp => {
        return obs.next({
          lng: resp.coords.longitude,
          lat: resp.coords.latitude,
        } as google.maps.LatLngLiteral);
      })
    ),
    of(this.defaultWarsawCoordinates)
  );
  private onResetLocalization$ = this.resetLocalization$.pipe(
    switchMap(() => this.currentCoordinates$)
  );
  private coordinates$ = merge(
    this.currentCoordinates$,
    this.onResetLocalization$
  );
  private onGetDeliveries$ = this.getDeliveries$.pipe(
    switchMap(params =>
      this.deliveriesApiService
        .listDeliveries(params.lat, params.long, params.distance, params.page)
        .pipe(
          catchError(err => {
            this.errorsService.showErrorMessage(err);
            this.error$.next(err);
            return of(undefined);
          })
        )
    )
  );
  private onGetRestaurants$ = this.getRestaurants$.pipe(
    switchMap(({ lat, long, distance, idCategory, page }) =>
      this.restaurantsService
        .listRestaurants(
          lat || this.defaultWarsawCoordinates.lat,
          long || this.defaultWarsawCoordinates.lng,
          undefined,
          distance,
          idCategory,
          page
        )
        .pipe(
          catchError(err => {
            this.errorsService.showErrorMessage(err);
            this.error$.next(err);
            return of(undefined);
          })
        )
    ),
    shareReplay(1)
  );

  private categories$ = this.categoriesService.listCategories().pipe(
    catchError(err => {
      this.errorsService.showErrorMessage(err);
      this.error$.next(err);
      return of([]);
    }),
    shareReplay(1)
  );
  private status$ = merge(
    merge(this.getRestaurants$, this.getDeliveries$).pipe(
      map(() => 'loading' as const)
    ),
    merge(this.onGetRestaurants$, this.onGetDeliveries$).pipe(
      filter(res => res !== undefined),
      map(() => 'success' as const)
    ),
    this.error$.pipe(map(() => 'error' as const))
  );
  private options = toSignal(
    this.coordinates$.pipe(
      map(
        center => ({ disableDefaultUI: true, center } as google.maps.MapOptions)
      )
    ),
    {
      initialValue: {
        disableDefaultUI: true,
        center: this.defaultWarsawCoordinates,
      } as google.maps.MapOptions,
    }
  );
  private orders = toSignal(this.onGetDeliveries$);
  private restaurants = toSignal(this.onGetRestaurants$);
  private categories = toSignal(this.categories$, { initialValue: [] });
  private status = toSignal(this.status$, { initialValue: null });
  private error = toSignal(this.error$.pipe(map(err => err.message)), {
    initialValue: null,
  });
  state: MapState = {
    orders: this.orders,
    categories: this.categories,
    options: this.options,
    restaurants: this.restaurants,
    status: this.status,
    error: this.error,
  };
}
