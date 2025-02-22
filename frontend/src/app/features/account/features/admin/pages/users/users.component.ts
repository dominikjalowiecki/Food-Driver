import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { DataService } from './services/data.service';
import { UsersTableComponent } from './ui/users-table/users-table.component';
import { ListUsers200ResponseResultsInner } from '../../../../../../shared/api';
import { TablePageEvent } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TranslatePipe } from '@ngx-translate/core';
import { Roles } from '../../../../../../core/utils/roles.enum';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    UsersTableComponent,
    InputTextModule,
    InputGroupModule,
    InputGroupAddonModule,
    ButtonModule,
    FormsModule,
    DialogModule,
    DropdownModule,
    ToggleButtonModule,
    TranslatePipe,
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
  providers: [DataService],
})
export class UsersComponent {
  private dataService = inject(DataService);
  private _usersData = this.dataService.state.usersData;
  roles = Roles;
  users = this.dataService.state.users;
  totalRecords = computed(() => this._usersData()?.count || 0);
  status = this.dataService.state.status;
  search = '';
  active = false;
  selectedRole = Roles.Klient;
  visible = false;
  selectedUser: ListUsers200ResponseResultsInner | undefined;
  edit(user: ListUsers200ResponseResultsInner) {
    this.selectedUser = user;
    this.active = user.active as boolean;
    this.selectedRole = user.role as Roles;
    this.visible = true;
  }
  submitChanges() {
    if (this.selectedUser) {
      this.dataService.editUser$.next({
        id: this.selectedUser.idUser,
        data: { active: this.active, role: this.selectedRole },
      });
      this.visible = false;
      this.active = false;
      this.selectedRole = Roles.Klient;
      this.selectedUser = undefined;
    }
  }
  searchUser() {
    this.dataService.getUsers$.next({ search: this.search, page: 1 });
  }
  changePage(e: TablePageEvent) {
    this.dataService.getUsers$.next({
      search: this.search,
      page: e.first / e.rows + 1,
    });
  }
}
