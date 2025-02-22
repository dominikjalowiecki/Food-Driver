import { Pipe, type PipeTransform } from '@angular/core';
import { ListMeOrders200ResponseResultsInner } from '../../../api';

@Pipe({
  name: 'appOrderPropertyAccess',
  standalone: true,
})
export class OrderPropertyAccessPipe implements PipeTransform {
  transform(
    value: ListMeOrders200ResponseResultsInner,
    propertyString: string
  ): unknown {
    return propertyString.split('.').reduce((o, i) => o[i], value);
  }
}
