import { CommonModule } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { DataService } from './services/data.service';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TranslatePipe } from '@ngx-translate/core';
import { DropdownModule } from 'primeng/dropdown';
import { FileUploadModule } from 'primeng/fileupload';
import { ImageModule } from 'primeng/image';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import {
  CreateImage201Response,
  ListMeOrders200ResponseResultsInnerRestaurantCategory,
} from '../../../../../../shared/api';
import { RestaurantData } from './dto/restaurant-data';
import { ImageUploadComponent } from '../../../../../../shared/ui/image-upload/image-upload.component';
@Component({
  selector: 'app-my-restaurant',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    InputTextModule,
    TranslatePipe,
    DropdownModule,
    FileUploadModule,
    ImageModule,
    ProgressSpinnerModule,
    ImageUploadComponent,
  ],
  templateUrl: './my-restaurant.component.html',
  styleUrl: './my-restaurant.component.css',
})
export class MyRestaurantComponent {
  private dataService = inject(DataService);
  private restaurant = this.dataService.state.restaurant;
  readonly maxFileSize = 2 * 1024 * 1024;
  categories = this.dataService.state.categories;
  status = this.dataService.state.status;
  form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    category:
      new FormControl<ListMeOrders200ResponseResultsInnerRestaurantCategory | null>(
        null,
        { nonNullable: true, validators: [Validators.required] }
      ),
    street: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    building: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    apartment: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    postalCode: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    city: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });
  previewSrc: string | undefined;
  editMode: boolean = false;
  uploadedImage: CreateImage201Response | undefined;
  isSet = false;
  constructor() {
    effect(
      () => {
        const restaurant = this.restaurant();
        if (restaurant) {
          if (!this.isSet) {
            this.form.patchValue(restaurant as any);
            if (restaurant?.image) this.previewSrc = restaurant.image as string;
            this.form.disable();
            this.isSet = true;
          }
        }
      },
      { allowSignalWrites: true }
    );
  }
  onImageUpload(image: CreateImage201Response) {
    this.uploadedImage = image;
  }
  edit() {
    this.editMode = true;
    this.form.enable();
  }
  cancel() {
    this.editMode = false;
    const restaurant = this.restaurant();
    if (restaurant && restaurant.image) {
      this.previewSrc = restaurant.image as string;
    } else {
      this.previewSrc = undefined;
    }
    if (restaurant) this.form.patchValue(restaurant as any);
    this.form.disable();
  }
  submit() {
    const restaurant = this.restaurant();
    if (
      this.form.valid &&
      (this.uploadedImage || (restaurant && restaurant.idImage))
    ) {
      this.dataService.updateRestaurant$.next({
        ...(this.form.value as RestaurantData),
        idImage: this.uploadedImage?.idImage || (restaurant?.idImage as number),
      });
      this.editMode = false;
      this.form.disable();
    }
  }
}
