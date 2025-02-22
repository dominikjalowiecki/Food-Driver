import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  viewChild,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';

@Component({
  selector: 'app-confirm-overlay',
  standalone: true,
  imports: [CommonModule, TranslatePipe, OverlayPanelModule, ButtonModule],
  templateUrl: './confirm-overlay.component.html',
  styleUrl: './confirm-overlay.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmOverlayComponent {
  op = viewChild.required<OverlayPanel>('op');
  onDeleteItem = output<void>();
  status = input.required<string | null>();
}
