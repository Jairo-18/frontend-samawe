/* eslint-disable @typescript-eslint/no-explicit-any */
import { SearchField } from './../../../shared/interfaces/search.interface';
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SearchFieldsComponent } from '../../../shared/components/search-fields/search-fields.component';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../auth/services/auth.service';
import {
  MatPaginator,
  MatPaginatorModule,
  PageEvent
} from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { PaginationInterface } from '../../../shared/interfaces/pagination.interface';
import { YesNoDialogComponent } from '../../../shared/components/yes-no-dialog/yes-no-dialog.component';
import { RelatedDataService } from '../../../shared/services/relatedData.service';
import { UserInterface } from '../../../shared/interfaces/user.interface';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import {
  CategoryType,
  CreateProductPanel
} from '../../interface/product.interface';
import { UserComplete } from '../../../organizational/interfaces/create.interface';
import { ProductsService } from '../../services/products.service';
@Component({
  selector: 'app-see-products',
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
    MatTabGroup
  ],
  templateUrl: './see-products.component.html',
  styleUrl: './see-products.component.scss'
})
export class SeeProductsComponent implements OnInit {
  private readonly _relatedDataService: RelatedDataService =
    inject(RelatedDataService);
  private readonly _productsService: ProductsService = inject(ProductsService);
  private readonly _activatedRoute: ActivatedRoute = inject(ActivatedRoute);
  private readonly _router = inject(Router);
  private readonly _matDialog: MatDialog = inject(MatDialog);
  private readonly _authService: AuthService = inject(AuthService);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(SearchFieldsComponent) searchComponent!: SearchFieldsComponent;

  displayedColumns: string[] = [
    'categoryType',
    'code',
    'name',
    'amount',
    'priceBuy',
    'priceSale',
    'actions'
  ];

  dataSource = new MatTableDataSource<CreateProductPanel>([]);
  categoryType: CategoryType[] = [];
  userLogged: UserInterface;
  form!: FormGroup;
  showClearButton: boolean = false;
  loading: boolean = false;
  isMobile: boolean = false;
  params: any = {};
  selectedTabIndex: number = 0;
  paginationParams: PaginationInterface = {
    page: 1,
    perPage: 5,
    total: 0,
    pageCount: 0,
    hasPreviousPage: false,
    hasNextPage: false
  };

  /**
   * @param searchFields - Creación del buscador.
   */
  searchFields: SearchField[] = [
    {
      name: 'categoryType',
      label: 'Categoría',
      type: 'select',
      options: [],
      placeholder: 'Buscar por categoría'
    },
    {
      name: 'code',
      label: 'Código',
      type: 'text',
      placeholder: 'Buscar por código'
    },
    {
      name: 'name',
      label: 'Nombre de producto',
      type: 'text',
      placeholder: 'Buscar por nombre de producto'
    },
    {
      name: 'amount',
      label: 'Unidades',
      type: 'text',
      placeholder: 'Buscar por unidades'
    },
    {
      name: 'priceBuy',
      label: 'Precio de compra',
      type: 'text',
      placeholder: 'Buscar por precio de compra'
    },
    {
      name: 'priceSale',
      label: 'Precio de venta',
      type: 'text',
      placeholder: 'Buscar por precio de venta'
    }
  ];

  /**
   * @param ngOnInit - Inicialización de las funciones.
   */
  ngOnInit(): void {
    this.loadProducts();
    this.getDataForFields();
  }

  constructor() {
    this.isMobile = window.innerWidth <= 768;
    if (this.isMobile) this.paginationParams.perPage = 5;
    this.userLogged = this._authService.getUserLoggedIn();
  }

  /**
   * @param _getDataForFields - Obtiene los select de roles y tipos de identificación.
   */
  private getDataForFields(): void {
    this._relatedDataService.createProductRelatedData().subscribe({
      next: (res) => {
        const categoryType = res.data?.categoryType || [];

        // Guardar para uso en los métodos getXXXName
        this.categoryType = categoryType;

        const categoryTypeOption = this.searchFields.find(
          (field) => field.name === 'categoryType'
        );

        if (categoryTypeOption) {
          categoryTypeOption.options = categoryType.map((type) => ({
            value: type.categoryTypeId,
            label: type.name || ''
          }));
        }
      },
      error: (err) => {
        console.error('Error cargando datos relacionados', err);
      }
    });
  }

  getCategoryTypeName(id: number): string {
    return this.categoryType.find((r) => r.categoryTypeId === id)?.name || '';
  }

  /**
   * @param onSearchSubmit - Botón de búsqueda.
   */
  onSearchSubmit(values: any): void {
    this.params = values;
    this.paginationParams.page = 1;
    this.loadProducts();
  }

  /**
   * @param onChangePagination - Cambio de paginación.
   */
  onChangePagination(event: PageEvent): void {
    this.paginationParams.page = event.pageIndex + 1;
    this.paginationParams.perPage = event.pageSize;
    this.loadProducts();
  }

  /**
   * @param onTabChange - Cambio de tabla.
   */
  onTabChange(index: number): void {
    this.selectedTabIndex = index;
  }

  onSearchChange(values: any): void {
    this.showClearButton = !!values.length;
  }

  /**
   * @param goToCreateUser - Ir a crear usuarios
   */
  goToCreateUser(): void {
    this._router.navigate(['/users/create']);
  }

  /**
   * @param loadUsers - Carga de usuarios.
   * @param getUserWithPagination - Obtiene los usuarios con paginación.
   */
  loadProducts(filter: string = ''): void {
    this.loading = true;
    const query = {
      page: this.paginationParams.page,
      perPage: this.paginationParams.perPage,
      search: filter,
      ...this.params
    };

    this._productsService.getProductWithPagination(query).subscribe({
      next: (res) => {
        this.dataSource.data = res.data || [];
        this.paginationParams = res?.pagination;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error en la solicitud:', error);
        this.loading = false;
      }
    });
  }

  /**
   * @param _deleteUser - Ellimina un usuario.
   */
  private deleteProduct(productId: number): void {
    this.loading = true;
    this._productsService.deleteProductPanel(productId).subscribe({
      next: () => {
        this.loadProducts();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error en la solicitud:', error);
        this.loading = false;
      }
    });
  }

  /**
   * @param openDeleteUserDialog - Abre un modal para eliminar un usuario.
   */
  openDeleteProductDialog(id: number): void {
    const dialogRef = this._matDialog.open(YesNoDialogComponent, {
      data: {
        title: '¿Deseas eliminar este producto?',
        message: 'Esta acción no se puede deshacer.'
      }
    });

    dialogRef.afterClosed().subscribe((confirm) => {
      if (confirm) {
        this.deleteProduct(id);
      }
    });
  }

  validateIfCanEditUserOrDelete(user: UserComplete): boolean {
    return (
      this.userLogged?.roleType?.name === 'Administrador' &&
      user.roleType?.name === 'Usuario'
    );
  }
}
