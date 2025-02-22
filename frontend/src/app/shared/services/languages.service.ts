import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { PrimeNGConfig, Translation } from 'primeng/api';
import { Subject, shareReplay, startWith, switchMap, take, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LanguagesService {
  private primeConfig = inject(PrimeNGConfig);
  private translate = inject(TranslateService);
  private http = inject(HttpClient);
  private pl$ = this.http
    .get<{ [key: string]: Translation }>(`/locales/pl.json`)
    .pipe(shareReplay(1));
  private en$ = this.http
    .get<{ [key: string]: Translation }>(`/locales/en.json`)
    .pipe(shareReplay(1));
  selectLanguage$ = new Subject<'pl' | 'en'>();

  private language$ = this.selectLanguage$.pipe(
    startWith('pl'),
    tap(lang => this.translate.use(lang)),
    switchMap(lang => (lang === 'pl' ? this.pl$ : this.en$)),
    tap(lang => this.primeConfig.setTranslation(lang[Object.keys(lang)[0]])),
    shareReplay(1)
  );

  language = toSignal(this.language$);
}
