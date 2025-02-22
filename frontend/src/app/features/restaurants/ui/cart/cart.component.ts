import { CommonModule, CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DEFAULT_CURRENCY_CODE,
  LOCALE_ID,
  computed,
  effect,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import {
  GetMe200Response,
  GetMeRestaurant200ResponseMenuInner,
} from '../../../../shared/api';
import { BadgeModule } from 'primeng/badge';
import { Stepper, StepperModule } from 'primeng/stepper';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { InputMaskModule } from 'primeng/inputmask';
import { InputNumberModule } from 'primeng/inputnumber';
import { FullAdress } from '../../../../shared/interfaces/full-adress';
import { MenuItemListComponent } from '../../../../shared/ui/menu-item-list/menu-item-list.component';
@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    TranslatePipe,
    BadgeModule,
    StepperModule,
    ReactiveFormsModule,
    InputTextModule,
    InputMaskModule,
    InputNumberModule,
    MenuItemListComponent,
  ],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartComponent {
  cart =
    input.required<
      Array<GetMeRestaurant200ResponseMenuInner & { quantity: number }>
    >();
  stepper = viewChild.required<Stepper>('stepper');
  personalData = input.required<GetMe200Response | null>();
  visible = model.required<boolean>();
  onRemoveItemFromCart = output<number>();
  onFinalize = output<FullAdress & { toPay: string }>();
  addressForm = new FormGroup({
    street: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    building: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    apartment: new FormControl('', {
      nonNullable: true,
    }),
    postalCode: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    city: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });
  sum = computed(() =>
    this.cart().reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    )
  );
  constructor() {
    effect(() => {
      const personalData = this.personalData();
      if (personalData) {
        this.addressForm.patchValue(personalData as any);
      }
    });
  }
  finalize(e: Event) {
    const data = this.addressForm.getRawValue();
    this.onFinalize.emit({
      ...data,
      apartment: data.apartment || '-',
      toPay: this.sum().toString(),
    });
    this.stepper().updateActiveStep(e, 0);
  }
}
