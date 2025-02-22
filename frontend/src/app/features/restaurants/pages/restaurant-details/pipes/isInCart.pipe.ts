import { Pipe, type PipeTransform } from '@angular/core';
import { GetMeRestaurant200ResponseMenuInner } from '../../../../../shared/api';

@Pipe({
  name: 'appIsInCart',
  standalone: true,
})
export class IsInCartPipe implements PipeTransform {
  transform(
    item: GetMeRestaurant200ResponseMenuInner,
    cart: GetMeRestaurant200ResponseMenuInner[]
  ): boolean {
    return cart.find(i => i.idMenuItem === item.idMenuItem) ? true : false;
  }
}
