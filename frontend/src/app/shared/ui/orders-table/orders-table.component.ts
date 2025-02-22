import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { TableModule, TablePageEvent } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ListMeOrders200Response } from '../../api';
import { OrderPropertyAccessPipe } from './pipes/order-property-access.pipe';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
@Component({
  selector: 'app-orders-table',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    TranslatePipe,
    CurrencyPipe,
    DatePipe,
    TagModule,
    OrderPropertyAccessPipe,
    RouterLink,
    ButtonModule,
  ],
  templateUrl: './orders-table.component.html',
  styleUrl: './orders-table.component.css',
})
export class OrdersTableComponent {
  onPage = output<TablePageEvent>();
  status = input.required<string | null>();
  orders = input.required<ListMeOrders200Response | undefined>();
  rows = input<number>(10);
  columnsNames = input<string[]>();
  columnsValues = input<string[]>();
  value = computed(() => this.orders()?.results || []);
}
