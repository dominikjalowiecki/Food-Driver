import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { OrdersTableComponent } from '../../../../../../shared/ui/orders-table/orders-table.component';
import { MyOrdersService } from '../../../../../../shared/services/my-orders.service';
import { OrdersFiltersComponent } from '../../../../../../shared/ui/orders-filters/orders-filters.component';
import { TablePageEvent } from 'primeng/table';
import { OrdersFilters } from '../../../../../../shared/ui/orders-filters/interfaces/orders-filters';

@Component({
  selector: 'app-my-deliveries',
  standalone: true,
  imports: [CommonModule, OrdersTableComponent, OrdersFiltersComponent],
  templateUrl: './my-deliveries.component.html',
  styleUrl: './my-deliveries.component.css',
})
export class MyDeliveriesComponent {
  private myOrdersService = inject(MyOrdersService);
  orders = this.myOrdersService.state.orders;
  status = this.myOrdersService.state.status;
  filters = this.myOrdersService.state.filters;

  filter(filters: OrdersFilters) {
    this.myOrdersService.filter$.next({ ...filters, page: 1 });
  }
  changePage(e: TablePageEvent) {
    this.myOrdersService.filter$.next({
      ...this.filters(),
      page: e.first / e.rows,
    });
  }
}
