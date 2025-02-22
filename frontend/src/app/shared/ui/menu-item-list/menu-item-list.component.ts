import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import {
  GetMeRestaurant200ResponseMenuInner,
  GetOrder200ResponseOrderItemsInner,
} from '../../api';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-menu-item-list',
  standalone: true,
  imports: [CommonModule, AvatarModule, BadgeModule, ButtonModule],
  templateUrl: './menu-item-list.component.html',
  styleUrl: './menu-item-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuItemListComponent {
  items =
    input.required<
      Array<
        | (GetMeRestaurant200ResponseMenuInner & { quantity: number })
        | GetOrder200ResponseOrderItemsInner
      >
    >();
  idName = input.required<string>();
  emptyMessage = input.required<string>();
  showActions = input<boolean>(false);
  onRemove = output<number>();
}
