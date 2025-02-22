import { Route } from '@angular/router';
import { OrderComponent } from './pages/order/order.component';
import { ChatComponent } from './pages/chat/chat.component';
import { roleGuard } from '../../core/guards/role.guard';
import { Roles } from '../../core/utils/roles.enum';

export default [
  {
    path: '',
    component: OrderComponent,
  },
  {
    path: 'chat',
    component: ChatComponent,
    canActivate: [roleGuard],
    data: {
      roles: [Roles.Klient, Roles.Administrator, Roles.Restaurator],
    },
  },
] as Route[];
