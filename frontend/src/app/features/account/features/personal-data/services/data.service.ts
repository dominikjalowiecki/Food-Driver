import { Injectable, Signal, computed, inject } from '@angular/core';
import { UserService } from '../../../../../core/data-access/user.service';
import { UserData } from '../../../interfaces/user-data';
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
import { UpdateMeRequest, UsersService } from '../../../../../shared/api';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorsService } from '../../../../../shared/services/http-errors.service';
export interface PersonalDataState {
  userData: Signal<UserData | null>;
  status: Signal<'success' | 'loading' | 'error' | null>;
}
@Injectable({ providedIn: 'root' })
export class DataService {
  private errorsService = inject(HttpErrorsService);
  private usersApiService = inject(UsersService);
  private userService = inject(UserService);
  private user = this.userService.state.user;
  private userData = computed(() => this.user() as UserData);
  private error$ = new Subject<Error>();
  updateUser$ = new Subject<UpdateMeRequest>();

  private onUpdateUser$ = this.updateUser$.pipe(
    switchMap(data =>
      this.usersApiService.updateMe(data).pipe(
        tap(() => this.userService.setUser({ ...this.user()!, ...data })),
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
    this.updateUser$.pipe(map(() => 'loading' as const)),
    this.onUpdateUser$.pipe(
      filter(res => res !== undefined),
      map(() => 'success' as const)
    ),
    this.error$.pipe(map(() => 'error' as const))
  );
  private status = toSignal(this.status$, { initialValue: null });
  state: PersonalDataState = {
    userData: this.userData,
    status: this.status,
  };
}
