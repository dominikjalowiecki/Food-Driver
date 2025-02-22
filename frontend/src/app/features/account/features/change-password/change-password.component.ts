import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { sameValues } from '../../../../shared/utils/sameValues.validator';
import { TranslatePipe } from '@ngx-translate/core';
import { DataService } from './services/data.service';
import { ChangePasswordRequest } from '../../../../shared/api';
import { MessagesModule } from 'primeng/messages';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule,
    InputTextModule,
    ButtonModule,
    TranslatePipe,
    ReactiveFormsModule,
    MessagesModule,
  ],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.css',
  providers: [DataService],
})
export class ChangePasswordComponent {
  private dataService = inject(DataService);
  status = this.dataService.state.status;
  changePasswordForm = new FormGroup({
    currentPassword: new FormControl('', {
      nonNullable: true,
      validators: Validators.required,
    }),
    newPassword: new FormControl('', {
      nonNullable: true,
      validators: Validators.required,
    }),
    confirmNewPassword: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, sameValues('newPassword')],
    }),
  });
  get currentPassword() {
    return this.changePasswordForm.get('currentPassword') as FormControl;
  }
  get newPassword() {
    return this.changePasswordForm.get('newPassword') as FormControl;
  }
  get confirmNewPassword() {
    return this.changePasswordForm.get('confirmNewPassword') as FormControl;
  }
  submit() {
    if (this.changePasswordForm.valid)
      this.dataService.changePassword$.next(
        this.changePasswordForm.value as ChangePasswordRequest
      );
  }
}
