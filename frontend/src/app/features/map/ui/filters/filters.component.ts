import { CommonModule } from '@angular/common';
import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostBinding,
  HostListener,
  computed,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SliderModule } from 'primeng/slider';
import { CardModule } from 'primeng/card';
import { Button, ButtonModule } from 'primeng/button';
import { FiltersParams } from '../../interfaces/filters-params';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { FiltersConfig } from '../../interfaces/filters-config';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { TranslatePipe } from '@ngx-translate/core';
import {
  GetMeRestaurant200ResponseCategory,
  ListMeOrders200ResponseResultsInnerRestaurantCategory,
} from '../../../../shared/api';
@Component({
  selector: 'app-filters',
  standalone: true,
  imports: [
    CommonModule,
    IconFieldModule,
    InputTextModule,
    InputIconModule,
    SliderModule,
    CardModule,
    ButtonModule,
    FormsModule,
    DropdownModule,
    TranslatePipe,
  ],
  templateUrl: './filters.component.html',
  styleUrl: './filters.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('hidden', [
      state('true', style({ transform: 'translateY(85%)' })),
      state('false', style({ transform: 'translateY(0)' })),
      transition('false=>true', [
        style({ transform: 'translateY(0)' }),
        animate(
          '400ms cubic-bezier(.04,.69,.14,.86)',
          style({ transform: 'translateY(85%)' })
        ),
      ]),
      transition('true=>false', [
        style({ transform: 'translateY(85%)' }),
        animate(
          '300ms cubic-bezier(.11,.45,0,1.03)',
          style({ transform: 'translateY(0)' })
        ),
      ]),
    ]),
  ],
  host: {
    '[@hidden]': 'hidden()',
  },
})
export class FiltersComponent implements AfterViewChecked {
  private readonly MD = 768;
  @HostListener('window:resize', ['$event'])
  onResize(): void {
    if (this.checkIsMobile()) {
      this.isMobile.set(true);
    } else {
      this.isMobile.set(false);
    }
  }
  private isHidden = signal(false);
  private isMobile = signal(false);
  isDelivery = input.required<boolean>();
  config = input.required<FiltersConfig>();
  options = computed(() => this.config().categories);
  onSetUserLocalization = output<void>();
  onSearch = output<FiltersParams>();
  distance = 10000;
  selectedCategory: ListMeOrders200ResponseResultsInnerRestaurantCategory | null =
    null;
  hidden = computed(() => this.isHidden() && this.isMobile());
  ngAfterViewChecked(): void {
    this.isMobile.set(this.checkIsMobile());
  }
  toggle() {
    this.isHidden.update(state => !state);
  }
  search() {
    this.onSearch.emit({
      distance: this.distance,
      idCategory: this.selectedCategory?.idCategory,
    });
  }
  private checkIsMobile(): boolean {
    return window.innerWidth < this.MD;
  }
}
