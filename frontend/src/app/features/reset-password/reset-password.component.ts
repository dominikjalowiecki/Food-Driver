import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
} from '@angular/core';
import { DataService } from './services/data.service';
import { ActivatedRoute } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CardModule } from 'primeng/card';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { sameValues } from '../../shared/utils/sameValues.validator';
import { toSignal } from '@angular/core/rxjs-interop';
import { Message } from 'primeng/api';
import { MessagesModule } from 'primeng/messages';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    InputTextModule,
    ButtonModule,
    TranslatePipe,
    CardModule,
    ReactiveFormsModule,
    MessagesModule,
  ],
  providers: [DataService],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css',
})
export class ResetPasswordComponent {
  private dataService = inject(DataService);
  status = this.dataService.state.status;
  token = input<string>();
  form = new FormGroup({
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    confirmPassword: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, sameValues('password')],
    }),
  });
  submit() {
    const token = this.token();
    const password = this.form.value.password;
    const confirmPassword = this.form.value.confirmPassword;
    if (token && password && confirmPassword)
      this.dataService.resetPasswordConfirm$.next({
        token,
        password,
        confirmPassword,
      });
  }
}
