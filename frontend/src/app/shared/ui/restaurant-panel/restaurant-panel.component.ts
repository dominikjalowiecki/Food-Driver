import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  GetOrder200ResponseRestaurant,
  GetRestaurant200Response,
} from '../../api';
import { PanelModule } from 'primeng/panel';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-restaurant-panel',
  standalone: true,
  imports: [CommonModule, PanelModule, NgOptimizedImage, TranslatePipe],
  templateUrl: './restaurant-panel.component.html',
  styleUrl: './restaurant-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestaurantPanelComponent {
  restaurant = input.required<
    GetRestaurant200Response | GetOrder200ResponseRestaurant
  >();
}
