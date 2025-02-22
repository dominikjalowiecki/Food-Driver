import { Injectable, Signal, inject, signal } from '@angular/core';
import {
  CreateChatMessageRequest,
  DeliveriesService,
  GetMe200Response,
  GetOrder200Response,
  GetOrder200ResponseDeliverer,
  OrderStatus,
  OrdersService,
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
import { toSignal } from '@angular/core/rxjs-interop';
import { DialogService } from 'primeng/dynamicdialog';
import { CreateReportDialogComponent } from '../ui/create-report-dialog/create-report-dialog.component';
import { TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { HttpErrorResponse } from '@angular/common/http';
import { UserData } from '../../../../account/interfaces/user-data';

export interface OrdersState {
  order: Signal<GetOrder200Response | undefined | null>;
  status: Signal<
    | 'completed'
    | 'report-created'
    | 'status-changed'
    | 'delivery-realize'
    | 'loading'
    | 'error'
    | null
  >;
}

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private toast = inject(MessageService);
  private translateService = inject(TranslateService);
  private dialog = inject(DialogService);
  private ordersApiService = inject(OrdersService);
  private deliveriesApiService = inject(DeliveriesService);
  private errorsService = inject(HttpErrorsService);
  private error$ = new Subject<Error>();
  createReport$ = new Subject<number>();
  getOrder$ = new Subject<number>();
  cancel$ = new Subject<{ id: number }>();
  resign$ = new Subject<{ id: number }>();
  acceptForRealize$ = new Subject<{ id: number }>();
  readyToDelivery$ = new Subject<{ id: number }>();
  pickUpForDelivery$ = new Subject<{ id: number }>();
  delivered$ = new Subject<{ id: number; idImage?: number }>();
  realized$ = new Subject<{ id: number }>();
  realizeDelivery$ = new Subject<{ id: number; user: GetMe200Response }>();
  private _order = signal<GetOrder200Response | undefined>(undefined);
  private onRealizeDelivery$ = this.realizeDelivery$.pipe(
    switchMap(({ id, user }) =>
      this.deliveriesApiService.realizeDelivery(id).pipe(
        catchError(err => {
          tap(() =>
            this._order.update(state =>
              state
                ? {
                    ...state,
                    deliverer: user,
                  }
                : undefined
            )
          );
          this.error$.next(err);
          this.errorsService.showErrorMessage(err);
          return of(undefined);
        })
      )
    ),
    shareReplay(1)
  );
  private onResign$ = this.resign$.pipe(
    switchMap(({ id }) =>
      this.ordersApiService.resignToDeliverOrder(id).pipe(
        tap(() =>
          this._order.update(state =>
            state ? { ...state, deliverer: null } : undefined
          )
        ),
        catchError(err => {
          this.errorsService.showErrorMessage(err);
          this.error$.next(err);
          return of(undefined);
        })
      )
    ),
    shareReplay(1)
  );
  private onAcceptToRealize$ = this.buildStatusChangeQuery(
    this.acceptForRealize$,
    OrderStatus.PrzyjteDoRealizacji
  );
  private onReadyToDelivery$ = this.buildStatusChangeQuery(
    this.readyToDelivery$,
    OrderStatus.GotoweDoDostawy
  );
  private onPickupForDelivery$ = this.buildStatusChangeQuery(
    this.pickUpForDelivery$,
    OrderStatus.OdebraneDoDostarczenia
  );
  private onDelivered$ = this.buildStatusChangeQuery(
    this.delivered$,
    OrderStatus.Dostarczone
  );
  private onRealized$ = this.buildStatusChangeQuery(
    this.realized$,
    OrderStatus.Zrealizowane
  );
  private onCancel$ = this.buildStatusChangeQuery(
    this.cancel$,
    OrderStatus.Anulowane
  );
  private onCreateReport$ = this.createReport$.pipe(
    switchMap(id => {
      const ref = this.dialog.open(CreateReportDialogComponent, {
        header: this.translateService.instant('report.dialogTitle'),
        width: '40vw',
        breakpoints: {
          '1499px': '50vw',
          '999px': '75vw',
          '499px': '90vw',
        },
      });
      return ref.onClose.pipe(
        filter(data => !!data),
        switchMap(data =>
          this.ordersApiService
            .createOrderReport(id, data as CreateChatMessageRequest)
            .pipe(
              tap(() =>
                this._order.update(state =>
                  state ? { ...state, reported: true } : undefined
                )
              ),
              catchError((err: HttpErrorResponse) => {
                if (err.status === 204) return of(true);
                this.error$.next(err);
                this.errorsService.showErrorMessage(err);
                return of(undefined);
              })
            )
        )
      );
    }),
    filter(res => res !== undefined),
    tap(() =>
      this.toast.add({
        severity: 'success',
        summary: this.translateService.instant('global.success'),
        detail: this.translateService.instant('report.success'),
      })
    ),
    shareReplay(1)
  );
  private onGetOrder$ = this.getOrder$.pipe(
    switchMap(id =>
      this.ordersApiService.getOrder(id).pipe(
        tap(order => this._order.set(order)),
        catchError(err => {
          this.error$.next(err);
          this.errorsService.showErrorMessage(err);
          return of(undefined);
        })
      )
    ),
    shareReplay(1)
  );
  private status$ = merge(
    this.getOrder$.pipe(map(() => 'loading' as const)),
    this.onGetOrder$.pipe(
      filter(res => res !== undefined),
      map(() => 'completed' as const)
    ),
    this.onCreateReport$.pipe(
      filter(res => res !== undefined),
      map(() => 'report-created' as const)
    ),
    this.onRealizeDelivery$.pipe(
      filter(res => res !== undefined),
      map(() => 'delivery-realize' as const)
    ),
    merge(
      this.onCancel$,
      this.onAcceptToRealize$,
      this.onReadyToDelivery$,
      this.onPickupForDelivery$,
      this.onDelivered$,
      this.onRealized$,
      this.onResign$
    ).pipe(
      filter(res => res !== undefined),
      map(() => 'status-changed' as const)
    ),
    this.error$.pipe(map(() => 'error' as const))
  );
  private order = this._order.asReadonly();
  private status = toSignal(this.status$, { initialValue: null });
  state: OrdersState = {
    order: this.order,
    status: this.status,
  };

  private buildStatusChangeQuery(
    source: Subject<{ id: number; idImage?: number }>,
    newStatus: OrderStatus
  ) {
    return source.pipe(
      switchMap(({ id, idImage }) => {
        let query: Observable<any> | undefined;
        switch (newStatus) {
          case OrderStatus.Anulowane:
            query = this.ordersApiService.cancelOrder(id);
            break;
          case OrderStatus.Dostarczone:
            if (!idImage) return of(undefined);
            query = this.ordersApiService.orderDelivered(id, { idImage });
            break;
          case OrderStatus.GotoweDoDostawy:
            query = this.ordersApiService.orderReadyForDelivery(id);
            break;
          case OrderStatus.OdebraneDoDostarczenia:
            query = this.ordersApiService.orderPickedUpForDelivery(id);
            break;
          case OrderStatus.PrzyjteDoRealizacji:
            query = this.ordersApiService.acceptOrderForRealization(id);
            break;
          case OrderStatus.Zrealizowane:
            query = this.ordersApiService.orderRealized(id);
        }
        if (!query) return of(undefined);
        return query.pipe(
          tap(() =>
            this._order.update(state =>
              state ? { ...state, status: newStatus } : undefined
            )
          ),
          catchError(err => {
            this.error$.next(err);
            this.errorsService.showErrorMessage(err);
            return of(undefined);
          })
        );
      })
    );
  }
}
