import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ImageUploadComponent } from '../../../../../../shared/ui/image-upload/image-upload.component';
import { FileSelectEvent, FileUploadHandlerEvent } from 'primeng/fileupload';
import { ImageUploaderService } from '../../../../../../shared/services/image-uploader.service';
import {
  CreateImage201Response,
  CreateMeRestaurantMenuItemRequest,
  GetMeRestaurant200ResponseMenuInner,
} from '../../../../../../shared/api';

@Component({
  selector: 'app-menu-item-form',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    TranslatePipe,
    ButtonModule,
    ReactiveFormsModule,
    InputTextModule,
    InputTextareaModule,
    InputNumberModule,
    ImageUploadComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './menu-item-form.component.html',
  styleUrl: './menu-item-form.component.css',
})
export class MenuItemFormComponent implements OnInit {
  private dialogRef = inject(DynamicDialogRef);
  private dialogConfig = inject(DynamicDialogConfig);
  form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: Validators.required,
    }),
    price: new FormControl(0, {
      nonNullable: true,
      validators: Validators.required,
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: Validators.required,
    }),
  });
  previewSrc: string | undefined;
  uploadedImage: CreateImage201Response | undefined;
  ngOnInit(): void {
    if (this.dialogConfig.data) {
      const data = this.dialogConfig.data
        .item as GetMeRestaurant200ResponseMenuInner;
      this.form.patchValue({ ...data, price: Number(data.price) });
      this.previewSrc = data.image;
      this.uploadedImage = { idImage: Number(data.idImage) };
    }
  }
  onImageUpload(image: CreateImage201Response) {
    this.uploadedImage = image;
  }
  submit(): void {
    const idImage = this.uploadedImage?.idImage;
    if (this.form.valid && idImage)
      this.dialogRef.close({
        ...this.form.getRawValue(),
        price: this.form.getRawValue().price.toString(),
        idImage: idImage,
        image: this.previewSrc,
      } as CreateMeRestaurantMenuItemRequest & { image: string });
  }
  close(): void {
    this.dialogRef.close();
  }
}
