import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { sameValues } from '../../shared/utils/sameValues.validator';
import { DataService } from './data-access/data.service';
import { SignUpRequest } from '../../shared/api';
import { MessagesModule } from 'primeng/messages';
@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    InputTextModule,
    ButtonModule,
    ReactiveFormsModule,
    TranslatePipe,
    MessagesModule,
  ],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.css',
})
export class SignUpComponent {
  private dataService = inject(DataService);
  status = this.dataService.state.status;
  signUpForm = new FormGroup({
    name: new FormControl('', Validators.required),
    surname: new FormControl('', Validators.required),
    email: new FormControl('', Validators.required),
    confirmEmail: new FormControl('', [
      Validators.required,
      sameValues('email'),
    ]),
    password: new FormControl('', Validators.required),
    confirmPassword: new FormControl('', [
      Validators.required,
      sameValues('password'),
    ]),
  });
  get name() {
    return this.signUpForm.get('name') as FormControl;
  }
  get surname() {
    return this.signUpForm.get('surname') as FormControl;
  }
  get email() {
    return this.signUpForm.get('email') as FormControl;
  }
  get confirmEmail() {
    return this.signUpForm.get('confirmEmail') as FormControl;
  }
  get password() {
    return this.signUpForm.get('password') as FormControl;
  }
  get confirmPassword() {
    return this.signUpForm.get('confirmPassword') as FormControl;
  }

  signUp() {
    if (this.signUpForm.valid)
      this.dataService.signUp$.next(this.signUpForm.value as SignUpRequest);
  }
}
