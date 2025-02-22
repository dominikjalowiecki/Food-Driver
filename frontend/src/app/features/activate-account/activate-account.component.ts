import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { DataService } from './services/data.service';
import { TranslatePipe } from '@ngx-translate/core';
import { MessagesModule } from 'primeng/messages';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-activate-account',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    MessagesModule,
    ProgressSpinnerModule,
    ButtonModule,
    RouterLink,
  ],
  templateUrl: './activate-account.component.html',
  styleUrl: './activate-account.component.css',
  providers: [DataService],
})
export class ActivateAccountComponent {
  private dataService = inject(DataService);
  status = this.dataService.state.status;
}
