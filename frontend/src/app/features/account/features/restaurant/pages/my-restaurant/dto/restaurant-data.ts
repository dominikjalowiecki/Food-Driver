import { ListMeOrders200ResponseResultsInnerRestaurantCategory } from '../../../../../../../shared/api';

export interface RestaurantData {
  name: string;
  description: string;
  category: ListMeOrders200ResponseResultsInnerRestaurantCategory;
  street: string;
  building: string;
  apartment: string;
  postalCode: string;
  city: string;
  idImage: number;
}
