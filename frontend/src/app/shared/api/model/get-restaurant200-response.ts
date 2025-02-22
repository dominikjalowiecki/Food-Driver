/**
 * Food Driver API
 *
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
import { GetMeRestaurant200ResponseMenuInner } from './get-me-restaurant200-response-menu-inner';
import { ListMeOrders200ResponseResultsInnerRestaurantCategory } from './list-me-orders200-response-results-inner-restaurant-category';


export interface GetRestaurant200Response { 
  [key: string]: any | any;


    /**
     * Unikalny identyfikator
     */
    idRestaurant: number;
    name: string;
    description: string;
    category: ListMeOrders200ResponseResultsInnerRestaurantCategory;
    image: string;
    street: string;
    building: string;
    apartment: string;
    postalCode: string;
    city: string;
    menu: Array<GetMeRestaurant200ResponseMenuInner>;
}

