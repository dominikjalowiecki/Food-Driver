/**
 * Food Driver API
 *
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
import { ListRestaurants200ResponseResultsInner } from './list-restaurants200-response-results-inner';


export interface ListRestaurants200Response { 
  [key: string]: any | any;


    count: number;
    pages: number;
    currentPage: number;
    results: Array<ListRestaurants200ResponseResultsInner>;
}

