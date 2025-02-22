import { Injectable, Signal, inject, signal } from '@angular/core';
import {
  CreateChatMessageRequest,
  ListChatMessages200Response,
  ListChatMessages200ResponseResultsInner,
  MessageType,
  OrdersService,
} from '../../../../../shared/api';
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
import { HttpErrorsService } from '../../../../../shared/services/http-errors.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { UserService } from '../../../../../core/data-access/user.service';

export interface ChatState {
  messages: Signal<ListChatMessages200ResponseResultsInner[]>;
  chat: Signal<ListChatMessages200Response | undefined>;
  status: Signal<
    | 'completed'
    | 'loading'
    | 'message-sending'
    | 'message-send'
    | 'error'
    | null
  >;
}

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private ordersApiService = inject(OrdersService);
  private errorsService = inject(HttpErrorsService);
  private error$ = new Subject<Error>();
  private userService = inject(UserService);
  getChat$ = new Subject<{ id: number; page?: number }>();
  createMessage$ = new Subject<{
    id: number;
    data: CreateChatMessageRequest;
    imageSrc?: string;
  }>();
  private _messages = signal<ListChatMessages200ResponseResultsInner[]>([]);
  private chat$ = this.getChat$.pipe(
    switchMap(({ id, page }) =>
      this.ordersApiService.listChatMessages(id, page).pipe(
        tap(({ results }) =>
          this._messages.update(state => [...results, ...state])
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
  private onCreateMessage$ = this.createMessage$.pipe(
    switchMap(({ id, data, imageSrc }) =>
      this.ordersApiService.createChatMessage(id, data).pipe(
        tap(() =>
          this._messages.update(state => [
            {
              idMessage: (state[0] ? state[0].idMessage : 0) + 1,
              user: this.userService.state.user()!,
              message: data.message,
              image: imageSrc || '',
              type: MessageType.Wiadomo,
              created: new Date().toUTCString(),
            },
            ...state,
          ])
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
  private status$ = merge(
    this.getChat$.pipe(map(() => 'loading' as const)),
    this.chat$.pipe(
      filter(res => res !== undefined),
      map(() => 'completed' as const)
    ),
    this.createMessage$.pipe(map(() => 'message-sending' as const)),
    this.onCreateMessage$.pipe(
      filter(res => res !== undefined),
      map(() => 'message-send' as const)
    ),
    this.error$.pipe(map(() => 'error' as const))
  );
  private messages = this._messages.asReadonly();
  private chat = toSignal(this.chat$, { initialValue: undefined });
  private status = toSignal(this.status$, { initialValue: null });
  state: ChatState = {
    messages: this.messages,
    chat: this.chat,
    status: this.status,
  };
}
