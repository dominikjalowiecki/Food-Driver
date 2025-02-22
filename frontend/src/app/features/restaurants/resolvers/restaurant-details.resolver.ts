import { inject } from '@angular/core';
import type { ResolveFn } from '@angular/router';
import {
  GetRestaurant200Response,
  RestaurantsService,
} from '../../../shared/api';

export const restaurantDetailsResolver: ResolveFn<GetRestaurant200Response> = (
  route,
  state
) => {
  const restaurantsService = inject(RestaurantsService);
  return restaurantsService.getRestaurant(Number(route.params['id']));
};
