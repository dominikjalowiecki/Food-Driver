import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { OrderStatus } from '../../api';
import { OrdersFilters } from './interfaces/orders-filters';
@Component({
  selector: 'app-orders-filters',
  standalone: true,
  imports: [
    CommonModule,
    DropdownModule,
    ToggleButtonModule,
    TranslatePipe,
    FormsModule,
    ButtonModule,
  ],
  templateUrl: './orders-filters.component.html',
  styleUrl: './orders-filters.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersFiltersComponent {
  filters = input.required<OrdersFilters>();
  options = OrderStatus;
  reported: boolean = false;
  status: OrderStatus | undefined;
  onFilter = output<OrdersFilters>();
  setStatus(status: OrderStatus) {
    this.status = status;
  }
  filter() {
    const filters: OrdersFilters = {};
    if (this.status) filters.status = this.status;
    filters.reported = this.reported;
    this.onFilter.emit(filters);
  }
}
