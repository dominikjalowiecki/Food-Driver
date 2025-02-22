import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { TableModule, TablePageEvent } from 'primeng/table';
import { ListUsers200ResponseResultsInner } from '../../../../../../../../shared/api';
import { TranslatePipe } from '@ngx-translate/core';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-users-table',
  standalone: true,
  imports: [CommonModule, TableModule, TranslatePipe, TagModule, ButtonModule],
  templateUrl: './users-table.component.html',
  styleUrl: './users-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersTableComponent {
  onPage = output<TablePageEvent>();
  onEdit = output<ListUsers200ResponseResultsInner>();
  totalRecords = input.required<number>();
  users = input.required<ListUsers200ResponseResultsInner[]>();
  status = input.required<string | null>();
  columns = [
    'name',
    'surname',
    'email',
    'role',
    'active',
    'activated',
    'created',
  ];
}
