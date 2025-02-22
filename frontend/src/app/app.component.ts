import { Component, OnInit, computed, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './core/layout/header/header.component';
import { LanguagesService } from './shared/services/languages.service';
import { TranslateService } from '@ngx-translate/core';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from './core/data-access/auth.service';
import { ResetPasswordRequest, SignInRequest } from './shared/api';
import { ToastModule } from 'primeng/toast';
import { FooterComponent } from './core/layout/footer/footer.component';
import { PushNotificationsService } from './core/data-access/push-notifications.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    HeaderComponent,
    TranslateModule,
    ToastModule,
    FooterComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  private languagesService = inject(LanguagesService);
  private authService = inject(AuthService);
  private translate = inject(TranslateService);
  private pushNotificationsService = inject(PushNotificationsService);
  status = this.authService.state.status;
  error = this.authService.state.error;
  language = computed(() => {
    const lang = this.languagesService.language();
    return lang && 'pl' in lang ? 'pl' : 'en';
  });
  constructor() {
    effect(() => this.pushNotificationsService.state.status());
  }
  ngOnInit(): void {
    this.translate.addLangs(['pl', 'en']);
    this.translate.setDefaultLang('pl');
  }
  selectLanguage(lang: 'pl' | 'en') {
    this.languagesService.selectLanguage$.next(lang);
  }
  login(credentials: SignInRequest) {
    this.authService.login$.next(credentials);
  }
  logout() {
    this.authService.logout$.next();
  }
  forgetPassword(data: ResetPasswordRequest) {
    this.authService.resetPassword$.next(data);
  }
}
