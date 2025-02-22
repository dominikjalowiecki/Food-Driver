import { Route } from '@angular/router';
import { RestaurantDetailsComponent } from './pages/restaurant-details/restaurant-details.component';
import { restaurantDetailsResolver } from './resolvers/restaurant-details.resolver';

export default [
  {
    path: ':id',
    component: RestaurantDetailsComponent,
    resolve: { restaurant: restaurantDetailsResolver },
  },
] as Route[];
