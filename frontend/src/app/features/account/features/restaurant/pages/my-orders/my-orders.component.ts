import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { TableModule, TablePageEvent } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { OrdersTableComponent } from '../../../../../../shared/ui/orders-table/orders-table.component';
import { OrdersFiltersComponent } from '../../../../../../shared/ui/orders-filters/orders-filters.component';
import { MyOrdersService } from '../../../../../../shared/services/my-orders.service';
import { OrdersFilters } from '../../../../../../shared/ui/orders-filters/interfaces/orders-filters';
@Component({
  selector: 'app-my-order',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    TagModule,
    OrdersTableComponent,
    OrdersFiltersComponent,
  ],
  templateUrl: './my-orders.component.html',
  styleUrl: './my-orders.component.css',
})
export class MyOrdersComponent {
  private myOrdersService = inject(MyOrdersService);
  filters = this.myOrdersService.state.filters;
  orders = this.myOrdersService.state.orders;
  status = this.myOrdersService.state.status;
  rows = 10;
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
