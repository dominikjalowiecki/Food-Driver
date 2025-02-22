import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import {
  FileSelectEvent,
  FileUpload,
  FileUploadHandlerEvent,
  FileUploadModule,
} from 'primeng/fileupload';
import { ImageModule } from 'primeng/image';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ImageUploaderService } from '../../services/image-uploader.service';
import { outputToObservable } from '@angular/core/rxjs-interop';
import { CreateImage201Response } from '../../api';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [
    CommonModule,
    FileUploadModule,
    TranslatePipe,
    ImageModule,
    ProgressSpinnerModule,
  ],
  providers: [ImageUploaderService],
  templateUrl: './image-upload.component.html',
  styleUrl: './image-upload.component.css',
})
export class ImageUploadComponent {
  private imageUploader = inject(ImageUploaderService);
  onUploadSuccess = output<CreateImage201Response>();
  small = input<boolean>(false);
  disabled = input<boolean>(false);
  fileUploader = viewChild.required<FileUpload>('fileUploader');
  status = this.imageUploader.state.status;
  previewSrc = model<string>();
  maxFileSize = 2 * 1024 * 1024;
  selected = false;
  constructor() {
    effect(() => {
      if (this.status() === 'success') {
        const image = this.imageUploader.state.image();
        if (image) {
          this.onUploadSuccess.emit(image);
          this.selected = false;
        }
      }
    });
  }
  onFileSelect(e: FileSelectEvent) {
    this.selected = true;
    this.previewSrc.set(URL.createObjectURL(e.currentFiles[0]));
  }
  onFileUpload(e: FileUploadHandlerEvent) {
    const file = e.files[0];
    if (file) this.imageUploader.uploadImage$.next(file);
  }
  clear() {
    this.previewSrc.set(undefined);
    this.fileUploader().clear();
  }
}
