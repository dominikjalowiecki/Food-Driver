import { CommonModule } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { DataService } from './services/data.service';
import { ButtonModule } from 'primeng/button';
import { TranslatePipe } from '@ngx-translate/core';
import { CardModule } from 'primeng/card';
import { ImageModule } from 'primeng/image';
import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';
import { GetMeRestaurant200ResponseMenuInner } from '../../../../../../shared/api';
import { ConfirmOverlayComponent } from '../../../../../../shared/ui/confirm-overlay/confirm-overlay.component';
import { ProgressBarModule } from 'primeng/progressbar';
@Component({
  selector: 'app-my-menu',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    TranslatePipe,
    CardModule,
    ImageModule,
    OverlayPanelModule,
    ConfirmOverlayComponent,
    ProgressBarModule,
  ],
  templateUrl: './my-menu.component.html',
  styleUrl: './my-menu.component.css',
})
export class MyMenuComponent {
  private dataService = inject(DataService);
  status = this.dataService.state.menuStatus;
  menu = this.dataService.state.menu;
  selectedItem: GetMeRestaurant200ResponseMenuInner | undefined;
  op: OverlayPanel | undefined;
  constructor() {
    effect(() => {
      if (this.status() === 'item-deleted') {
        this.op?.hide();
      }
    });
  }
  addMenuItem() {
    this.dataService.addMenuItem$.next();
  }
  editItem(item: GetMeRestaurant200ResponseMenuInner) {
    this.dataService.editMenuItem$.next(item);
  }
  deleteItem() {
    if (this.selectedItem)
      this.dataService.deleteMenuItem$.next(this.selectedItem);
  }
  showConfirm(
    confirmOverlay: ConfirmOverlayComponent,
    e: Event,
    item: GetMeRestaurant200ResponseMenuInner
  ) {
    this.selectedItem = item;
    this.op = confirmOverlay.op();
    this.op.show(e);
  }
}
