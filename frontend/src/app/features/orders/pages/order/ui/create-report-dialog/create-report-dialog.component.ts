import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ImageUploadComponent } from '../../../../../../shared/ui/image-upload/image-upload.component';
import { InputTextareaModule } from 'primeng/inputtextarea';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TranslatePipe } from '@ngx-translate/core';
import {
  CreateChatMessageRequest,
  CreateImage201Response,
} from '../../../../../../shared/api';
import { DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-create-report-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ImageUploadComponent,
    InputTextareaModule,
    ReactiveFormsModule,
    ButtonModule,
    TranslatePipe,
  ],
  templateUrl: './create-report-dialog.component.html',
  styleUrl: './create-report-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateReportDialogComponent {
  private dialogRef = inject(DynamicDialogRef);
  message = new FormControl('', [Validators.required]);
  image: CreateImage201Response | undefined;
  setImage(image: CreateImage201Response) {
    this.image = image;
  }
  submit() {
    this.dialogRef.close({
      message: this.message.getRawValue(),
      idImage: this.image?.idImage,
    } as CreateChatMessageRequest);
  }
}
