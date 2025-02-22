/**
 * Food Driver API
 *
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


export interface UpdateMeRestaurantRequest { 
  [key: string]: any | any;


    name: string;
    description: string;
    /**
     * Unikalny identyfikator
     */
    idCategory: number;
    /**
     * Unikalny identyfikator
     */
    idImage: number;
    street: string;
    building: string;
    apartment: string;
    postalCode: string;
    city: string;
}

