/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, inject, OnInit } from '@angular/core';
import { RelatedDataService } from '../../../shared/services/relatedData.service';
import { CommonModule } from '@angular/common';
import { TypeItem } from '../../../shared/interfaces/relatedDataGeneral';
import { PaginationInterface } from '../../../shared/interfaces/pagination.interface';
import { TYPE_ENTITY_LABELS_ES } from '../../../shared/constants/type.contstants';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../auth/services/auth.service';
import { UserInterface } from '../../../shared/interfaces/user.interface';
import { SearchFieldsComponent } from '../../../shared/components/search-fields/search-fields.component';
import { SearchField } from '../../../shared/interfaces/search.interface';

@Component({
  selector: 'app-card-types',
  imports: [
    CommonModule,
    MatPaginatorModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatIconModule,
    SearchFieldsComponent
  ],
  templateUrl: './card-types.component.html',
  styleUrls: ['./card-types.component.scss']
})
export class CardTypesComponent implements OnInit {
  private readonly _relatedDataService: RelatedDataService =
    inject(RelatedDataService);
  private readonly _authService: AuthService = inject(AuthService);

  loading: boolean = false;
  showClearButton: boolean = false;
  isMobile: boolean = false;
  userLogged: UserInterface;

  searchFields: SearchField[] = [
    {
      name: 'name',
      label: 'Nombre',
      type: 'text',
      placeholder: 'Buscar nombre'
    },
    {
      name: 'code',
      label: 'Tipo / Prefijo',
      type: 'text',
      placeholder: 'Buscar por tipo / prefijo'
    }
  ];

  groupedTypes: {
    typeName: string;
    label: string;
    items: TypeItem[];
    pagination: PaginationInterface;
    params: any;
  }[] = [];

  constructor() {
    this.isMobile = window.innerWidth <= 768;
    this.userLogged = this._authService.getUserLoggedIn();
  }

  ngOnInit() {
    this.initializeGroups();
  }

  initializeGroups(): void {
    const typeKeys = Object.keys(TYPE_ENTITY_LABELS_ES);

    this.groupedTypes = typeKeys.map((typeName) => ({
      typeName,
      label: TYPE_ENTITY_LABELS_ES[typeName],
      items: [],
      pagination: {
        page: 1,
        perPage: 5,
        total: 0,
        pageCount: 0,
        hasPreviousPage: false,
        hasNextPage: false
      },
      params: {}
    }));

    this.groupedTypes.forEach((_, index) => this.loadGroupData(index));
  }

  loadGroupData(groupIndex: number): void {
    const group = this.groupedTypes[groupIndex];

    // Extraemos solo los filtros que esperamos (name y code)
    const filters = {
      name: typeof group.params?.name === 'string' ? group.params.name : '',
      code: typeof group.params?.code === 'string' ? group.params.code : ''
    };

    const query = {
      page: group.pagination.page,
      perPage: group.pagination.perPage,
      ...filters
    };

    this.loading = true;
    this._relatedDataService
      .getEntitiesWithPagination(group.typeName, query)
      .subscribe({
        next: (res) => {
          group.items = res.data || [];
          group.pagination = res.pagination || group.pagination;
          this.loading = false;
        },
        error: (err) => {
          console.error(`Error cargando grupo ${group.typeName}`, err);
          this.loading = false;
        }
      });
  }

  onSearchSubmit(event: { groupIndex: number; values: any }): void {
    const group = this.groupedTypes[event.groupIndex];
    group.params = event.values;
    group.pagination.page = 1;
    this.loadGroupData(event.groupIndex);
  }

  onSearchChange(event: { groupIndex: number; value: any }): void {
    const group = this.groupedTypes[event.groupIndex];
    const filters = event.value?.value ?? {};

    group.params = filters;
    group.pagination.page = 1;

    this.showClearButton =
      !!filters &&
      Object.values(filters).some(
        (val) => typeof val === 'string' && val.trim() !== ''
      );

    this.loadGroupData(event.groupIndex);
  }

  onChangePagination(event: PageEvent, groupIndex: number): void {
    const group = this.groupedTypes[groupIndex];
    group.pagination.page = event.pageIndex + 1;
    group.pagination.perPage = event.pageSize;
    this.loadGroupData(groupIndex);
  }
}
