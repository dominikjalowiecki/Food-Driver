import { CommonModule } from '@angular/common';
import { Component, Signal, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { DividerModule } from 'primeng/divider';
import { MenuModule } from 'primeng/menu';
import { MenubarModule } from 'primeng/menubar';
import { filter, map, tap } from 'rxjs';
import { JwtService } from '../../shared/services/jwt.service';
import { Roles } from '../../core/utils/roles.enum';
import { TranslateService } from '@ngx-translate/core';
import { UserService } from '../../core/data-access/user.service';
@Component({
  selector: 'app-account',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MenuModule,
    MenubarModule,
    DividerModule,
  ],
  templateUrl: './account.component.html',
  styleUrl: './account.component.css',
})
export class AccountComponent {
  private router = inject(Router);
  private userService = inject(UserService);
  private jwtService = inject(JwtService);
  private translateService = inject(TranslateService);
  private activeRoute = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => (e as NavigationEnd).url.substring(9))
    ),
    { initialValue: this.router.url }
  );
  private user = this.userService.state.user;
  userDisplay = computed(() => this.user()?.name + ' ' + this.user()?.surname);
  //Account
  private readonly SIDEBAR_ACCOUNT = 'sidebar.account';
  private readonly SIDEBAR_MY_ACCOUNT = 'sidebar.myAccount';
  private readonly SIDEBAR_CHANGE_PASSWORD = 'sidebar.changePassword';
  private readonly sidebarAccount = toSignal(
    this.translateService.stream(this.SIDEBAR_ACCOUNT),
    { initialValue: this.translateService.instant(this.SIDEBAR_ACCOUNT) }
  );
  private readonly sidebarMyAccount = toSignal(
    this.translateService.stream(this.SIDEBAR_MY_ACCOUNT),
    { initialValue: this.translateService.instant(this.SIDEBAR_MY_ACCOUNT) }
  );
  private readonly sidebarChangePassword = toSignal(
    this.translateService.stream(this.SIDEBAR_CHANGE_PASSWORD),
    {
      initialValue: this.translateService.instant(this.SIDEBAR_CHANGE_PASSWORD),
    }
  );
  //Client
  private readonly SIDEBAR_ORDERS = 'sidebar.orders';
  private readonly SIDEBAR_MY_ORDERS = 'sidebar.myOrders';
  private readonly sidebarOrders = toSignal(
    this.translateService.stream(this.SIDEBAR_ORDERS),
    { initialValue: this.translateService.instant(this.SIDEBAR_ORDERS) }
  );
  private readonly sidebarMyOrders = toSignal(
    this.translateService.stream(this.SIDEBAR_MY_ORDERS),
    { initialValue: this.translateService.instant(this.SIDEBAR_MY_ORDERS) }
  );
  //Restaurant
  private readonly SIDEBAR_RESTAURANT = 'sidebar.restaurant';
  private readonly SIDEBAR_MY_RESTAURANT = 'sidebar.myRestaurant';
  private readonly SIDEBAR_MY_MENU = 'sidebar.myMenu';
  private readonly SIDEBAR_RESTAURANT_ORDERS = 'sidebar.restaurantOrders';
  private readonly sidebarRestaurant = toSignal(
    this.translateService.stream(this.SIDEBAR_RESTAURANT),
    { initialValue: this.translateService.instant(this.SIDEBAR_RESTAURANT) }
  );

  private readonly sidebarMyRestaurant = toSignal(
    this.translateService.stream(this.SIDEBAR_MY_RESTAURANT),
    { initialValue: this.translateService.instant(this.SIDEBAR_MY_RESTAURANT) }
  );
  private readonly sidebarMyMenu = toSignal(
    this.translateService.stream(this.SIDEBAR_MY_MENU),
    { initialValue: this.translateService.instant(this.SIDEBAR_MY_MENU) }
  );
  private readonly sidebarRestaurantOrders = toSignal(
    this.translateService.stream(this.SIDEBAR_RESTAURANT_ORDERS),
    {
      initialValue: this.translateService.instant(
        this.SIDEBAR_RESTAURANT_ORDERS
      ),
    }
  );
  //Delivery
  private readonly SIDEBAR_MY_DELIVERIES = 'sidebar.myDeliveries';
  private readonly sidebarMyDeliveries = toSignal(
    this.translateService.stream(this.SIDEBAR_MY_DELIVERIES),
    { initialValue: this.translateService.instant(this.SIDEBAR_MY_DELIVERIES) }
  );
  private deliveryRoutes: Signal<MenuItem[]> = computed(() => [
    {
      label: this.sidebarOrders(),
      items: [
        {
          label: this.sidebarMyDeliveries(),
          routerLink: 'delivery/my-deliveries',
          icon: '',
        },
      ],
    },
  ]);
  //Admin
  private readonly SIDEBAR_OPERATIONS = 'sidebar.operations';
  private readonly SIDEBAR_USERS = 'sidebar.users';
  private readonly sidebarOperations = toSignal(
    this.translateService.stream(this.SIDEBAR_OPERATIONS),
    { initialValue: this.translateService.instant(this.SIDEBAR_OPERATIONS) }
  );
  private readonly sidebarUsers = toSignal(
    this.translateService.stream(this.SIDEBAR_USERS),
    { initialValue: this.translateService.instant(this.SIDEBAR_USERS) }
  );
  private adminRoutes: Signal<MenuItem[]> = computed(() => [
    {
      label: this.sidebarOperations(),
      items: [
        {
          label: this.sidebarUsers(),
          routerLink: 'admin/users',
          icon: '',
        },
      ],
    },
  ]);
  private clientRoutes: Signal<MenuItem[]> = computed(
    () =>
      [
        {
          label: this.sidebarOrders(),
          items: [
            {
              label: this.sidebarMyOrders(),
              routerLink: 'user/my-orders',
              icon: 'pi pi-shopping-bag',
            },
          ],
        },
      ] as MenuItem[]
  );
  private restaurantRoutes: Signal<MenuItem[]> = computed(
    () =>
      [
        {
          label: this.sidebarRestaurant(),
          items: [
            {
              label: this.sidebarMyRestaurant(),
              routerLink: 'restaurant/my-restaurant',
            },
            {
              label: this.sidebarMyMenu(),
              routerLink: 'restaurant/my-menu',
            },
            {
              label: this.sidebarRestaurantOrders(),
              routerLink: 'restaurant/orders',
            },
          ],
        },
      ] as MenuItem[]
  );
  private basicRoutes = computed(() => [
    {
      label: this.sidebarAccount(),
      items: [
        {
          label: this.sidebarMyAccount(),
          routerLink: 'me',
          icon: 'pi pi-id-card',
        },
        {
          label: this.sidebarChangePassword(),
          icon: 'pi pi-key',
          routerLink: 'change-password',
        },
      ],
    },
  ]);
  label = computed(
    () =>
      ([] as MenuItem[])
        .concat(...this.links())
        .concat(...this.links().map(l => l.items || []))
        .find(i => i.routerLink == this.activeRoute())?.label
  );
  links: Signal<MenuItem[]> = computed(() => [
    ...this.basicRoutes(),
    ...(this.jwtService.getRole() === Roles.Klient
      ? this.clientRoutes()
      : this.jwtService.getRole() === Roles.Dostawca
      ? this.deliveryRoutes()
      : this.jwtService.getRole() === Roles.Administrator
      ? this.adminRoutes()
      : this.restaurantRoutes()),
  ]);
}
