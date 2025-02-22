import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
@Injectable({
  providedIn: 'root',
})
export class HttpErrorsService {
  private translateService = inject(TranslateService);
  private toast = inject(MessageService);
  showErrorMessage(err: HttpErrorResponse) {
    this.toast.add({
      summary: this.translateService.instant('global.error'),
      detail: this.getErrorMessage(err),
      severity: 'error',
    });
  }
  private getErrorMessage(err: HttpErrorResponse) {
    switch (err.status) {
      case 400:
        return err.error.message;
      case 401:
        return this.translateService.instant('errors.unauthorized');
      case 403:
        return this.translateService.instant('errors.forbidden');
      default:
        return this.translateService.instant('errors.default');
    }
  }
}
