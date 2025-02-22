import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { ButtonGroupModule } from 'primeng/buttongroup';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { InputTextModule } from 'primeng/inputtext';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ResetPasswordRequest, SignInRequest } from '../../../shared/api';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MessagesModule } from 'primeng/messages';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    ToolbarModule,
    ButtonModule,
    ButtonGroupModule,
    RouterLink,
    TranslatePipe,
    OverlayPanelModule,
    InputTextModule,
    ReactiveFormsModule,
    MessagesModule,
    InputGroupAddonModule,
    InputGroupModule,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  onForgetPassword = output<ResetPasswordRequest>();
  onLogin = output<SignInRequest>();
  onLogout = output<void>();
  onSwitchLanguage = output<'pl' | 'en'>();
  language = input.required<'pl' | 'en'>();
  status = input.required<string | null>();
  error = input.required<string | null>();
  label = computed(() => (this.language() === 'pl' ? 'Polski' : 'English'));
  loginForm = new FormGroup({
    email: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required),
  });
  forgetPassword = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });
  loginMode = true;
  get email() {
    return this.loginForm.get('email') as FormControl;
  }
  get password() {
    return this.loginForm.get('password') as FormControl;
  }
  submitForgetPassword(): void {
    this.onForgetPassword.emit({ email: this.forgetPassword.value });
  }
  setForgetPasswordMode(): void {
    this.loginMode = false;
  }
  setLoginMode() {
    this.loginMode = true;
  }
  switchLanguage(): void {
    this.onSwitchLanguage.emit(this.language() === 'en' ? 'pl' : 'en');
  }
  login(): void {
    if (this.loginForm.valid) {
      this.onLogin.emit(this.loginForm.value as SignInRequest);
      this.loginForm.reset();
    }
  }
  logout(): void {
    this.onLogout.emit();
  }
}
