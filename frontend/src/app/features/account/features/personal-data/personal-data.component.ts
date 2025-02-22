import { CommonModule } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { InputTextModule } from 'primeng/inputtext';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DataService } from './services/data.service';
import { UpdateMeRequest } from '../../../../shared/api';
import { InputMaskModule } from 'primeng/inputmask';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessagesModule } from 'primeng/messages';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { filter, tap } from 'rxjs';

@Component({
  selector: 'app-personal-data',
  standalone: true,
  imports: [
    CommonModule,
    InputTextModule,
    TranslatePipe,
    ReactiveFormsModule,
    ButtonModule,
    TranslatePipe,
    InputMaskModule,
    InputNumberModule,
    MessagesModule,
  ],
  templateUrl: './personal-data.component.html',
  styleUrl: './personal-data.component.css',
})
export class PersonalDataComponent {
  private dataService = inject(DataService);
  updateMode = false;
  userData = this.dataService.state.userData;
  status = toSignal(
    toObservable(this.dataService.state.status).pipe(
      tap(res => {
        if (res === 'success') {
          this.disableFields();
        }
      })
    )
  );
  form = new FormGroup({
    name: new FormControl(''),
    surname: new FormControl(''),
    email: new FormControl(''),
    street: new FormControl(''),
    building: new FormControl(''),
    apartment: new FormControl(''),
    postalCode: new FormControl(''),
    city: new FormControl(''),
  });
  private readonly updateableFields = [
    'name',
    'surname',
    'street',
    'building',
    'apartment',
    'postalCode',
    'city',
  ];
  constructor() {
    effect(() => {
      const userData = this.userData();
      if (userData) this.form.patchValue(userData);
      this.form.disable();
    });
  }
  enableFields(): void {
    this.getUpdateableFields().forEach(f => f.enable());
    this.updateMode = true;
  }
  disableFields(): void {
    this.getUpdateableFields().forEach(f => f.disable());
    this.updateMode = false;
  }
  submit(): void {
    this.dataService.updateUser$.next(this.form.value as UpdateMeRequest);
  }
  private getUpdateableFields(): FormControl[] {
    return this.updateableFields.map(
      f => this.form.get(f) as FormControl
    ) as FormControl[];
  }
}
