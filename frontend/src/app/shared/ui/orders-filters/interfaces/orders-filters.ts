import { OrderStatus } from '../../../api';

export interface OrdersFilters {
  status?: OrderStatus;
  reported?: boolean;
  page?: number;
}
