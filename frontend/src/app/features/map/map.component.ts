import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { GoogleMap, GoogleMapsModule } from '@angular/google-maps';
import { FiltersComponent } from './ui/filters/filters.component';
import { DataService } from './data-access/data.service';
import { FiltersParams } from './interfaces/filters-params';
import {
  ListOrdersParams,
  ListRestaurantsParams,
} from './interfaces/list-restaurants-params';
import { RestaurantsListComponent } from './ui/restaurants-list/restaurants-list.component';
import { DialogModule } from 'primeng/dialog';
import { TranslatePipe } from '@ngx-translate/core';
import { OrdersTableComponent } from '../../shared/ui/orders-table/orders-table.component';
import { JwtService } from '../../shared/services/jwt.service';
import { Roles } from '../../core/utils/roles.enum';
import { DataViewPageEvent } from 'primeng/dataview';
import { TablePageEvent } from 'primeng/table';
@Component({
  selector: 'app-map',
  standalone: true,
  imports: [
    CommonModule,
    GoogleMapsModule,
    FiltersComponent,
    RestaurantsListComponent,
    DialogModule,
    TranslatePipe,
    OrdersTableComponent,
  ],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
})
export class MapComponent {
  private dataService = inject(DataService);
  private jwtService = inject(JwtService);
  private googleMap = viewChild.required<GoogleMap>('googleMap');
  deliveries = this.dataService.state.orders;
  categories = this.dataService.state.categories;
  restaurants = this.dataService.state.restaurants;
  status = this.dataService.state.status;
  options = this.dataService.state.options;
  restaurantsVisible = false;
  ordersVisible = false;
  filters: ListRestaurantsParams | undefined = undefined;
  isDelivery = this.jwtService.checkToken()
    ? this.jwtService.getRole() === Roles.Dostawca
    : false;
  onPageChanged(event: DataViewPageEvent | TablePageEvent) {
    const page = event.first / event.rows + 1;
    this.executeSearch({ ...this.filters, page });
  }
  executeSearch(filtersParams: FiltersParams) {
    const lat = this.googleMap().getCenter()?.lat();
    const long = this.googleMap().getCenter()?.lng();
    this.filters = { ...filtersParams };
    if (lat && long) {
      const params: ListRestaurantsParams | ListOrdersParams = {
        ...this.filters,
        lat,
        long,
      };
      this.filters = params;
      if (this.isDelivery) {
        this.searchOrders(params);
      } else {
        this.searchRestaurants(params);
      }
    }
  }
  searchRestaurants(params: ListRestaurantsParams) {
    this.restaurantsVisible = true;
    this.dataService.getRestaurants$.next(params);
  }
  searchOrders(params: ListOrdersParams) {
    this.ordersVisible = true;
    this.dataService.getDeliveries$.next(params);
  }
  setUserLocalization() {
    this.dataService.resetLocalization$.next();
  }
}
