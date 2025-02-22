import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import {
  CreateMeRestaurantMenuItemRequest,
  GetMeRestaurant200Response,
  GetMeRestaurant200ResponseMenuInner,
  UsersService,
} from '../../../../../../../shared/api';
import {
  RestaurantService,
  RestaurantState,
} from '../../../services/restaurant.service';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
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
import { MenuItemFormComponent } from '../../../ui/menu-item-form/menu-item-form.component';
import { TranslateService } from '@ngx-translate/core';
import { HttpErrorsService } from '../../../../../../../shared/services/http-errors.service';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';

export interface MyMenuState {
  menu: Signal<GetMeRestaurant200ResponseMenuInner[] | undefined>;
  restaurantStatus: RestaurantState['status'];
  menuStatus: Signal<
    'success' | 'loading' | 'item-deleted' | 'item-updated' | 'error' | null
  >;
}

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private errorsService = inject(HttpErrorsService);
  private translateService = inject(TranslateService);
  private dialogService = inject(DialogService);
  private usersApiService = inject(UsersService);
  private restaurantService = inject(RestaurantService);
  private readonly basicDialogConfig = {
    width: '55vw',
    breakpoints: {
      '960px': '75vw',
      '640px': '90vw',
    },
    modal: true,
  };
  private error$ = new Subject<Error>();
  private menu = signal<GetMeRestaurant200ResponseMenuInner[]>([]);
  private menu$ = toObservable(this.restaurantService.state.restaurant);
  private setMenu$ = this.menu$.pipe(
    filter(res => res !== undefined),
    map(res => res as GetMeRestaurant200Response),
    tap(({ menu }) => this.menu.set(menu))
  );
  private dialogRef$: DynamicDialogRef | undefined = undefined;
  editMenuItem$ = new Subject<GetMeRestaurant200ResponseMenuInner>();
  deleteMenuItem$ = new Subject<GetMeRestaurant200ResponseMenuInner>();
  addMenuItem$ = new Subject<void>();
  private onEditMenuItem$ = this.editMenuItem$.pipe(
    switchMap(item => {
      const ref = this.dialogService.open(MenuItemFormComponent, {
        data: { item },
        header: this.translateService.instant('myMenu.editMenu'),
        ...this.basicDialogConfig,
      });
      return ref.onClose.pipe(
        filter(data => !!data),
        tap(data =>
          this.menu.update(state =>
            state.map(i =>
              i.idMenuItem == item.idMenuItem ? { ...i, ...data } : i
            )
          )
        ),
        switchMap(data =>
          this.usersApiService.updateMeRestaurantMenuItem(
            item.idMenuItem,
            data as CreateMeRestaurantMenuItemRequest
          )
        )
      );
    }),
    shareReplay(1)
  );
  private onDeleteMenuItem$ = this.deleteMenuItem$.pipe(
    switchMap(item =>
      this.usersApiService.deleteMeRestaurantMenuItem(item.idMenuItem).pipe(
        tap(() =>
          this.menu.update(state =>
            state.filter(i => i.idMenuItem !== item.idMenuItem)
          )
        ),
        catchError(err => {
          this.error$.next(err);
          this.errorsService.showErrorMessage(err);
          return of(undefined);
        })
      )
    ),
    shareReplay(1)
  );
  private onAddMenuItem$ = this.addMenuItem$.pipe(
    switchMap(() => {
      this.dialogRef$ = this.dialogService.open(MenuItemFormComponent, {
        header: this.translateService.instant('myMenu.addItemTitle'),
        ...this.basicDialogConfig,
      });
      return this.dialogRef$.onClose.pipe(
        filter(data => !!data),
        switchMap((data: CreateMeRestaurantMenuItemRequest) =>
          this.usersApiService.createMeRestaurantMenuItem(data).pipe(
            catchError((err: HttpErrorResponse) => {
              if (err.status === 201) {
                return of(true);
              }
              this.error$.next(err);
              this.errorsService.showErrorMessage(err);
              return of(undefined);
            })
          )
        ),
        filter(res => res === true),
        tap(() => this.restaurantService.reloadRestaurant$.next()),
        shareReplay(1)
      );
    })
  );
  private status$: Observable<
    'success' | 'item-updated' | 'item-deleted' | 'loading' | 'error' | null
  > = merge(
    this.dialogRef$?.onClose.pipe(map(val => (val ? 'loading' : null))) ||
      of(null),
    this.menu$.pipe(map(() => 'loading' as const)),
    this.setMenu$.pipe(map(() => 'success' as const)),
    this.deleteMenuItem$.pipe(map(() => 'loading' as const)),
    this.onEditMenuItem$.pipe(
      filter(res => res !== undefined),
      map(() => 'item-updated' as const)
    ),
    this.onDeleteMenuItem$.pipe(
      filter(res => res !== undefined),
      map(() => 'item-deleted' as const)
    ),
    merge(this.menu$, this.onAddMenuItem$).pipe(
      filter(res => res !== undefined),
      map(() => 'success' as const)
    ),
    this.error$.pipe(map(() => 'error' as const))
  );
  private restaurantStatus = this.restaurantService.state.status;
  private menuStatus = toSignal(this.status$, { initialValue: null });
  state: MyMenuState = {
    menu: this.menu.asReadonly(),
    restaurantStatus: this.restaurantStatus,
    menuStatus: this.menuStatus,
  };
}
