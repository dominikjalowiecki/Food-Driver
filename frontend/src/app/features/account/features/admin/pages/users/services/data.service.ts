import { Injectable, Signal, inject, signal } from '@angular/core';
import {
  ListUsers200Response,
  ListUsers200ResponseResultsInner,
  UpdateUserRequest,
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
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import { ListUsersParams } from '../interfaces/list-users-params';
import { HttpErrorsService } from '../../../../../../../shared/services/http-errors.service';
import { toSignal } from '@angular/core/rxjs-interop';

export interface AdminUsersState {
  users: Signal<ListUsers200ResponseResultsInner[]>;
  usersData: Signal<ListUsers200Response | undefined>;
  status: Signal<'completed' | 'loading' | 'user-edited' | 'error' | null>;
}

@Injectable()
export class DataService {
  private usersApiService = inject(UsersService);
  private errorsService = inject(HttpErrorsService);
  getUsers$ = new Subject<{ search?: string; page?: number }>();
  editUser$ = new Subject<{ id: number; data: UpdateUserRequest }>();
  private error$ = new Subject<Error>();
  private _users = signal<ListUsers200ResponseResultsInner[]>([]);
  private onEdit$ = this.editUser$.pipe(
    switchMap(({ id, data }) =>
      this.usersApiService.updateUser(id, data).pipe(
        tap(() =>
          this._users.update(state =>
            state.map(u =>
              u.idUser === id
                ? {
                    ...u,
                    active: data.active,
                    activated: data.active
                      ? new Date().toUTCString()
                      : (null as any),
                    role: data.role,
                  }
                : u
            )
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
  private usersData$ = this.getUsers$.pipe(
    startWith({ page: 1 } as ListUsersParams),
    switchMap(params =>
      this.usersApiService.listUsers(params.search, params.page).pipe(
        tap(({ results }) => this._users.set(results)),
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
    this.getUsers$.pipe(map(() => 'loading' as const)),
    this.usersData$.pipe(
      filter(res => res !== undefined),
      map(() => 'completed' as const)
    ),
    this.onEdit$.pipe(map(() => 'user-edited' as const)),
    this.error$.pipe(map(() => 'error' as const))
  );
  private users = this._users.asReadonly();
  private usersData = toSignal(this.usersData$, { initialValue: undefined });
  private status = toSignal(this.status$, { initialValue: null });

  state: AdminUsersState = {
    users: this.users,
    usersData: this.usersData,
    status: this.status,
  };
}
