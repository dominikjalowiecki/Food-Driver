/**
 * Food Driver API
 *
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
import { ListMeOrders200ResponseResultsInnerRestaurantCategory } from './list-me-orders200-response-results-inner-restaurant-category';


export interface ListRestaurants200ResponseResultsInner { 
  [key: string]: any | any;


    /**
     * Unikalny identyfikator
     */
    idRestaurant: number;
    name: string;
    category: ListMeOrders200ResponseResultsInnerRestaurantCategory;
    image: string;
}

