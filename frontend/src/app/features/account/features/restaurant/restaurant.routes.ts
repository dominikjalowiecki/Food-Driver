import { Route } from '@angular/router';
import { MyRestaurantComponent } from './pages/my-restaurant/my-restaurant.component';
import { MyMenuComponent } from './pages/my-menu/my-menu.component';
import { MyOrdersComponent } from './pages/my-orders/my-orders.component';

export default [
  {
    path: 'my-restaurant',
    component: MyRestaurantComponent,
  },
  {
    path: 'my-menu',
    component: MyMenuComponent,
  },
  {
    path: 'orders',
    component: MyOrdersComponent,
  },
] as Route[];
