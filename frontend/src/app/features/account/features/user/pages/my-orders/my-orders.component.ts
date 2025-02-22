import { CommonModule } from '@angular/common';
import { Component, inject, viewChild } from '@angular/core';
import { OrdersTableComponent } from '../../../../../../shared/ui/orders-table/orders-table.component';
import { MyOrdersService } from '../../../../../../shared/services/my-orders.service';
import { OrdersFiltersComponent } from '../../../../../../shared/ui/orders-filters/orders-filters.component';
import { TablePageEvent } from 'primeng/table';
import { OrdersFilters } from '../../../../../../shared/ui/orders-filters/interfaces/orders-filters';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-my-order',
  standalone: true,
  imports: [
    CommonModule,
    OrdersTableComponent,
    OrdersFiltersComponent,
    ButtonModule,
  ],
  templateUrl: './my-orders.component.html',
  styleUrl: './my-orders.component.css',
})
export class MyOrdersComponent {
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
