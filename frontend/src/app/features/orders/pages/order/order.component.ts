import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, input } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { RestaurantPanelComponent } from '../../../../shared/ui/restaurant-panel/restaurant-panel.component';
import { DividerModule } from 'primeng/divider';
import { PanelModule } from 'primeng/panel';
import { FieldsetModule } from 'primeng/fieldset';
import { TagModule } from 'primeng/tag';
import { MenuItemListComponent } from '../../../../shared/ui/menu-item-list/menu-item-list.component';
import { ButtonModule } from 'primeng/button';
import { DataService } from './services/data.service';
import { JwtService } from '../../../../shared/services/jwt.service';
import { Roles } from '../../../../core/utils/roles.enum';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { ConfirmationService } from 'primeng/api';
import {
  CreateImage201Response,
  GetMe200Response,
  OrderStatus,
} from '../../../../shared/api';
import { Subject, every } from 'rxjs';
import { ImageUploadComponent } from '../../../../shared/ui/image-upload/image-upload.component';
import { DialogModule } from 'primeng/dialog';
import { RouterLink } from '@angular/router';
import { UserService } from '../../../../core/data-access/user.service';
@Component({
  selector: 'app-my-order',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    TranslatePipe,
    RestaurantPanelComponent,
    DividerModule,
    PanelModule,
    FieldsetModule,
    TagModule,
    MenuItemListComponent,
    ButtonModule,
    ConfirmPopupModule,
    ImageUploadComponent,
    DialogModule,
    RouterLink,
  ],
  templateUrl: './order.component.html',
  styleUrl: './order.component.css',
})
export class OrderComponent implements OnInit {
  private dataService = inject(DataService);
  private jwtService = inject(JwtService);
  private userService = inject(UserService);
  private confirmationService = inject(ConfirmationService);
  private translateService = inject(TranslateService);
  user = this.userService.state.user;
  status = OrderStatus;
  role = this.jwtService.getRole();
  roles = Roles;
  id = input.required<number>();
  order = this.dataService.state.order;
  details = ['payment', 'status', 'reported', 'created'];
  deliveryAddress = ['street', 'building', 'apartment', 'postalCode', 'city'];
  client = ['name', 'surname'];
  imageDialogVisible = false;
  ngOnInit(): void {
    this.dataService.getOrder$.next(this.id());
  }
  createReport() {
    this.dataService.createReport$.next(this.id());
  }
  cancel(event: Event) {
    this.executeConfirmation(event, this.dataService.cancel$);
  }
  realize(event: Event) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: this.translateService.instant('global.confirmAction'),
      icon: 'pi pi-question',
      accept: () => {
        const user = this.user();
        if (user)
          this.dataService.realizeDelivery$.next({ id: this.id(), user });
      },
    });
  }
  resign(event: Event) {
    this.executeConfirmation(event, this.dataService.resign$);
  }
  acceptForRealize(event: Event) {
    this.executeConfirmation(event, this.dataService.acceptForRealize$);
  }
  readyToDelivery(event: Event) {
    this.executeConfirmation(event, this.dataService.readyToDelivery$);
  }
  pickUpForDelivery(event: Event) {
    this.executeConfirmation(event, this.dataService.pickUpForDelivery$);
  }
  delivered(image: CreateImage201Response) {
    this.dataService.delivered$.next({
      id: this.id(),
      idImage: image.idImage,
    });
    this.imageDialogVisible = false;
  }
  realized(event: Event) {
    this.executeConfirmation(event, this.dataService.realized$);
  }
  private executeConfirmation(event: Event, subject: Subject<{ id: number }>) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: this.translateService.instant('global.confirmAction'),
      icon: 'pi pi-question',
      accept: () => {
        subject.next({ id: this.id() });
      },
    });
  }
}
