import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { ListRestaurants200Response } from '../../../../shared/api';
import { DataViewModule, DataViewPageEvent } from 'primeng/dataview';
import { RouterLink } from '@angular/router';
import { SkeletonModule } from 'primeng/skeleton';
@Component({
  selector: 'app-restaurants-list',
  standalone: true,
  imports: [CommonModule, DataViewModule, RouterLink, SkeletonModule],
  templateUrl: './restaurants-list.component.html',
  styleUrl: './restaurants-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestaurantsListComponent {
  onPage = output<DataViewPageEvent>();
  data = input.required<ListRestaurants200Response | undefined>();
  restaurants = computed(() => this.data()?.results || []);
  count = computed(() => this.data()?.count);
  loading = input.required<boolean>();
  rows = 10;
  fillers = Array(this.rows);
}
