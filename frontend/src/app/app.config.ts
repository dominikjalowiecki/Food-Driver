import {
  ApplicationConfig,
  provideZoneChangeDetection,
  isDevMode,
  importProvidersFrom,
  LOCALE_ID,
  DEFAULT_CURRENCY_CODE,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';
import { environment } from '../environments/environment';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ApiModule, Configuration } from './shared/api';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { ConfirmationService, MessageService } from 'primeng/api';
import { authErrorInterceptor } from './core/interceptors/auth-error.interceptor';
import { DialogService } from 'primeng/dynamicdialog';
import '@angular/common/locales/global/pl';
const httpLoaderFactory: (http: HttpClient) => TranslateHttpLoader = (
  http: HttpClient
) => new TranslateHttpLoader(http, './i18n/', '.json');

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    provideHttpClient(
      withInterceptors([authInterceptor, authErrorInterceptor])
    ),
    provideAnimationsAsync(),
    importProvidersFrom(
      ApiModule.forRoot(() => {
        return new Configuration({ basePath: environment.url });
      }),
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: httpLoaderFactory,
          deps: [HttpClient],
        },
      })
    ),
    MessageService,
    DialogService,
    ConfirmationService,
    { provide: LOCALE_ID, useValue: 'pl' },
    { provide: DEFAULT_CURRENCY_CODE, useValue: 'PLN' },
  ],
};
