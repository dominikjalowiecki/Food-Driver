import { Injectable, Signal, inject } from '@angular/core';
import {
  Subject,
  switchMap,
  catchError,
  of,
  startWith,
  shareReplay,
  merge,
  map,
  filter,
} from 'rxjs';
import { CreateImage201Response, ImagesService } from '../api';
import { HttpErrorsService } from './http-errors.service';
import { toSignal } from '@angular/core/rxjs-interop';

export interface ImageState {
  image: Signal<CreateImage201Response | undefined>;
  status: Signal<'success' | 'loading' | 'error' | null>;
}

@Injectable()
export class ImageUploaderService {
  private imagesApiService = inject(ImagesService);
  private error$ = new Subject<Error>();
  private errorsService = inject(HttpErrorsService);
  uploadImage$ = new Subject<Blob>();
  private onUploadImage$ = this.uploadImage$.pipe(
    switchMap(image =>
      this.imagesApiService.createImage(image).pipe(
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
    this.uploadImage$.pipe(map(() => 'loading' as const)),
    this.onUploadImage$.pipe(
      filter(res => res !== undefined),
      map(() => 'success' as const)
    ),
    this.error$.pipe(map(() => 'error' as const))
  );
  private image = toSignal(this.onUploadImage$, { initialValue: undefined });
  private status = toSignal(this.status$, { initialValue: null });
  state: ImageState = {
    image: this.image,
    status: this.status,
  };
}
