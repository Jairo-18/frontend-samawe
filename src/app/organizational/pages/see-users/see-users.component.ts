import {
  IdentificationType,
  PhoneCode,
  RoleType
} from './../../../shared/interfaces/relatedDataGeneral';
import { SearchField } from './../../../shared/interfaces/search.interface';
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { SearchFieldsComponent } from '../../../shared/components/search-fields/search-fields.component';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { UsersService } from '../../services/users.service';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../auth/services/auth.service';
import {
  MatPaginator,
  MatPaginatorModule,
  PageEvent
} from '@angular/material/paginator';
import { finalize } from 'rxjs';
import { UserComplete } from '../../interfaces/create.interface';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { PaginationInterface } from '../../../shared/interfaces/pagination.interface';
import { YesNoDialogComponent } from '../../../shared/components/yes-no-dialog/yes-no-dialog.component';
import { RelatedDataService } from '../../../shared/services/relatedData.service';
import { UserInterface } from '../../../shared/interfaces/user.interface';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { BasePageComponent } from '../../../shared/components/base-page/base-page.component';
@Component({
  selector: 'app-see-users',
  standalone: true,
  imports: [
    MatButtonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIcon,
    CommonModule,
    MatPaginatorModule,
    MatTableModule,
    RouterLink,
    SearchFieldsComponent,
    LoaderComponent,
    MatTab,
    MatTabGroup,
    BasePageComponent
  ],
  templateUrl: './see-users.component.html',
  styleUrl: './see-users.component.scss'
})
export class SeeUsersComponent implements OnInit {
  private readonly _relatedDataService: RelatedDataService =
    inject(RelatedDataService);
  private readonly _usersService: UsersService = inject(UsersService);
  private readonly _router = inject(Router);
  private readonly _matDialog: MatDialog = inject(MatDialog);
  private readonly _authService: AuthService = inject(AuthService);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(SearchFieldsComponent) searchComponent!: SearchFieldsComponent;
  displayedColumns: string[] = [
    'identificationType',
    'identificationNumber',
    'firstName',
    'lastName',
    'roleType',
    'phoneCode',
    'phone',
    'isActive',
    'actions'
  ];
  dataSource = new MatTableDataSource<UserComplete>([]);
  roleType: RoleType[] = [];
  identificationType: IdentificationType[] = [];
  phoneCode: PhoneCode[] = [];
  userLogged: UserInterface;
  form!: FormGroup;
  showClearButton: boolean = false;
  loading: boolean = false;
  loadingFields: boolean = false;
  isMobile: boolean = false;
  params: any = {};
  selectedTabIndex: number = 0;
  paginationParams: PaginationInterface = {
    page: 1,
    perPage: 25,
    total: 0,
    pageCount: 0,
    hasPreviousPage: false,
    hasNextPage: false
  };
  searchFields: SearchField[] = [
    {
      name: 'search',
      label: 'Nombre, apellido o identificación',
      type: 'text',
      placeholder: ' '
    },
    {
      name: 'roleType',
      label: 'Rol',
      type: 'select',
      options: [],
      placeholder: 'Buscar por rol'
    },
    {
      name: 'identificationType',
      label: 'Tipo de identificación',
      type: 'select',
      options: [],
      placeholder: 'Buscar por tipo de identificación'
    },
    {
      name: 'phoneCode',
      label: 'Nacionalidad',
      type: 'select',
      placeholder: 'Buscar por nacionalidad'
    },
    {
      name: 'isActive',
      label: 'Estado',
      type: 'select',
      options: [
        { value: true, label: 'Activo' },
        { value: false, label: 'Inactivo' }
      ],
      placeholder: 'Buscar por estado'
    }
  ];
  ngOnInit(): void {
    this.loadUsers();
    this.getDataForFields();
  }
  constructor() {
    this.isMobile = window.innerWidth <= 768;
    if (this.isMobile) this.paginationParams.perPage = 5;
    this.userLogged = this._authService.getUserLoggedIn();
  }
  private getDataForFields(): void {
    if (this._relatedDataService.relatedData()) {
      this._applyRelatedData(this._relatedDataService.relatedData()!.data);
      return;
    }
    this.loadingFields = true;
    this._relatedDataService
      .getRelatedData()
      .pipe(
        finalize(() => {
          this.loadingFields = false;
        })
      )
      .subscribe({
        next: (res) => {
          this._applyRelatedData(res.data);
        },
        error: (err) => {
          console.error('Error cargando datos relacionados', err);
        }
      });
  }
  private _applyRelatedData(data: any): void {
    const role = data?.roleType || [];
    const identificationType = data?.identificationType || [];
    const phoneCode = data?.phoneCode || [];
    this.roleType = role;
    this.identificationType = identificationType;
    this.phoneCode = phoneCode;
    const roleOption = this.searchFields.find(
      (field) => field.name === 'roleType'
    );
    const identificationTypeOption = this.searchFields.find(
      (field) => field.name === 'identificationType'
    );
    const phoneCodeOption = this.searchFields.find(
      (field) => field.name === 'phoneCode'
    );
    if (roleOption) {
      roleOption.options = role.map((r: any) => ({
        value: r.roleTypeId,
        label: r.name || ''
      }));
    }
    if (identificationTypeOption) {
      identificationTypeOption.options = identificationType.map(
        (type: any) => ({
          value: type.identificationTypeId,
          label: type.name || ''
        })
      );
    }
    if (phoneCodeOption) {
      phoneCodeOption.options = phoneCode.map((type: any) => ({
        value: type.phoneCodeId,
        label: type.name || ''
      }));
    }
  }
  getRoleName(id: string): string {
    return this.roleType.find((r) => r.roleTypeId === id)?.name || '';
  }
  getIdentificationTypeName(id: string): string {
    return (
      this.identificationType.find((t) => t.identificationTypeId === id)
        ?.code || ''
    );
  }
  getPhoneCodeDisplay(id: string): string {
    const phoneCode = this.phoneCode.find((p) => p.phoneCodeId === id);
    return phoneCode ? `${phoneCode.code} - ${phoneCode.name}` : '';
  }
  onSearchSubmit(values: any): void {
    this.params = values;
    this.paginationParams.page = 1;
    this.loadUsers();
  }
  onChangePagination(event: PageEvent): void {
    this.paginationParams.page = event.pageIndex + 1;
    this.paginationParams.perPage = event.pageSize;
    this.loadUsers();
  }
  onTabChange(index: number): void {
    this.selectedTabIndex = index;
  }
  onSearchChange(form: any): void {
    this.showClearButton = !!form.length;
    this.params = form?.value;
    this.paginationParams.page = 1;
    this.loadUsers();
  }
  goToCreateUser(): void {
    this._router.navigate(['/users/create']);
  }
  loadUsers(filter: string = ''): void {
    this.loading = true;
    const query = {
      page: this.paginationParams.page,
      perPage: this.paginationParams.perPage,
      search: filter,
      ...this.params
    };
    this._usersService.getUserWithPagination(query).subscribe({
      next: (res) => {
        this.dataSource.data = (res.data || []).sort((a, b) =>
          a.firstName.localeCompare(b.firstName)
        );
        this.paginationParams = res?.pagination;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error en la solicitud:', error);
        this.loading = false;
      }
    });
  }
  private deleteUser(userId: string): void {
    this.loading = true;
    this._usersService.deleteUserPanel(userId).subscribe({
      next: () => {
        this.loadUsers();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error en la solicitud:', error);
        this.loading = false;
      }
    });
  }
  openDeleteUserDialog(id: string): void {
    const dialogRef = this._matDialog.open(YesNoDialogComponent, {
      data: {
        title: '¿Deseas eliminar este usuario?',
        message: 'Esta acción no se puede deshacer.'
      }
    });
    dialogRef.afterClosed().subscribe((confirm) => {
      if (confirm) {
        this.deleteUser(id);
      }
    });
  }
  canEditUser(user: UserComplete): boolean {
    const loggedInRoleName = this.userLogged?.roleType?.name?.toUpperCase();
    const userToActOnRoleName = user.roleType?.name?.toUpperCase();
    const isCurrentUser = this.userLogged?.userId === user.userId;
    if (loggedInRoleName === 'ADMINISTRADOR') {
      return true;
    }
    if (loggedInRoleName === 'RECEPCIONISTA') {
      return (
        userToActOnRoleName === 'CLIENTE' ||
        userToActOnRoleName === 'PROVEEDOR' ||
        isCurrentUser
      );
    }
    if (loggedInRoleName === 'CLIENTE' || loggedInRoleName === 'USUARIO') {
      return isCurrentUser;
    }
    return false;
  }
  canDeleteUser(user: UserComplete): boolean {
    const loggedInRoleName = this.userLogged?.roleType?.name?.toUpperCase();
    const userToActOnRoleName = user.roleType?.name?.toUpperCase();
    const isCurrentUser = this.userLogged?.userId === user.userId;
    if (isCurrentUser) {
      return false;
    }
    if (loggedInRoleName === 'ADMINISTRADOR') {
      return true;
    }
    if (loggedInRoleName === 'RECEPCIONISTA') {
      return (
        userToActOnRoleName === 'CLIENTE' || userToActOnRoleName === 'PROVEEDOR'
      );
    }
    return false;
  }
  validateIfCanEditUserOrDelete(user: UserComplete): boolean {
    return !this.canEditUser(user) && !this.canDeleteUser(user);
  }
  canViewUserActions(user: UserComplete): boolean {
    return this.canEditUser(user) || this.canDeleteUser(user);
  }
}

