import { CommonModule, NgOptimizedImage } from '@angular/common';
import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  CreateOrderRequest,
  GetMeRestaurant200ResponseMenuInner,
  GetRestaurant200Response,
} from '../../../../shared/api';
import { PanelModule } from 'primeng/panel';
import { DividerModule } from 'primeng/divider';
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../../../core/data-access/auth.service';
import { JwtService } from '../../../../shared/services/jwt.service';
import { Roles } from '../../../../core/utils/roles.enum';
import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';
import { InputNumberModule } from 'primeng/inputnumber';
import { TranslatePipe } from '@ngx-translate/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { CarouselModule } from 'primeng/carousel';
import { BadgeModule } from 'primeng/badge';
import { DialogModule } from 'primeng/dialog';
import { AvatarModule } from 'primeng/avatar';
import { IsInCartPipe } from './pipes/isInCart.pipe';
import { CartComponent } from '../../ui/cart/cart.component';
import { UserService } from '../../../../core/data-access/user.service';
import { FullAdress } from '../../../../shared/interfaces/full-adress';
import { DataService } from '../../services/data.service';
import { MessagesModule } from 'primeng/messages';
import { RestaurantPanelComponent } from '../../../../shared/ui/restaurant-panel/restaurant-panel.component';
@Component({
  selector: 'app-restaurant-details',
  standalone: true,
  imports: [
    CommonModule,
    NgOptimizedImage,
    PanelModule,
    DividerModule,
    AccordionModule,
    ButtonModule,
    OverlayPanelModule,
    InputNumberModule,
    TranslatePipe,
    ReactiveFormsModule,
    CarouselModule,
    BadgeModule,
    DialogModule,
    AvatarModule,
    IsInCartPipe,
    CartComponent,
    RestaurantPanelComponent,
  ],
  templateUrl: './restaurant-details.component.html',
  styleUrl: './restaurant-details.component.css',
})
export class RestaurantDetailsComponent {
  private dataService = inject(DataService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private jwtService = inject(JwtService);
  private route = inject(ActivatedRoute);
  status = this.dataService.state.status;
  private itemAmount = viewChild.required<OverlayPanel>('itemAmount');
  user = this.userService.state.user;
  isClient = this.jwtService.checkToken()
    ? this.jwtService.getRole() === Roles.Klient
    : false;
  authStatus = this.authService.state.status;
  restaurant = this.route.snapshot.data[
    'restaurant'
  ] as GetRestaurant200Response;
  private _cart = signal<
    Array<GetMeRestaurant200ResponseMenuInner & { quantity: number }>
  >([]);
  cart = this._cart.asReadonly();
  amount = new FormControl(1, {
    nonNullable: true,
    validators: [Validators.required, Validators.min(1), Validators.max(20)],
  });
  selectedItem: GetMeRestaurant200ResponseMenuInner | undefined;
  visible = false;
  showAmountOverlay(e: Event, product: GetMeRestaurant200ResponseMenuInner) {
    e.preventDefault();
    this.selectedItem = product;
    this.itemAmount().show(e);
  }
  addToCart() {
    if (this.selectedItem) {
      const item = {
        ...this.selectedItem,
        quantity: this.amount.getRawValue(),
      };
      this._cart.update(state => [...state, item]);
      this.itemAmount().hide();
    }
  }
  openCart() {
    this.visible = true;
  }
  removeItemFromCart(id: number) {
    this._cart.update(state => state.filter(i => i.idMenuItem !== id));
  }
  finalize(addressData: FullAdress & { toPay: string }) {
    const data = {
      ...addressData,
      menuItems: this.cart().map(i => ({
        idMenuItem: i.idMenuItem,
        quantity: i.quantity,
      })),
      idRestaurant: this.restaurant.idRestaurant,
    } as CreateOrderRequest;
    this.dataService.createOrder$.next(data);
  }
}
