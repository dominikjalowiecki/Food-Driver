import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-forbidden-access',
  standalone: true,
  imports: [CommonModule, ButtonModule, RouterLink, TranslatePipe],
  templateUrl: './forbidden-access.component.html',
  styleUrl: './forbidden-access.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForbiddenAccessComponent {}
