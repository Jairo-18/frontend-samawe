/* eslint-disable @typescript-eslint/no-explicit-any */
import { ProductComplete } from './../../interface/product.interface';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  PLATFORM_ID,
  ViewChild
} from '@angular/core';
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
import { UserInterface } from '../../../shared/interfaces/user.interface';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ProductsService } from '../../services/products.service';
import { EarningService } from '../../../sales/services/earning.service';
import {
  CategoryType,
  UnitOfMeasure
} from '../../../shared/interfaces/relatedDataGeneral';
import { SectionHeaderComponent } from '../../../shared/components/section-header/section-header.component';
import { FormatCopPipe } from '../../../shared/pipes/format-cop.pipe';
import { FormatPercentPipe } from '../../../shared/pipes/format-percent.pipe';
import { ProductsPrintComponent } from '../../../shared/components/products-print/products-print.component';
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
    MatTabGroup,
    SectionHeaderComponent,
    FormatCopPipe,
    FormatPercentPipe,
    ProductsPrintComponent
  ],
  templateUrl: './see-products.component.html',
  styleUrl: './see-products.component.scss'
})
export class SeeProductsComponent implements OnInit {
  @Input() searchFieldsProducts: any[] = [];
  @Input() categoryTypes: CategoryType[] = [];
  @Input() unitOfMeasureTypes: UnitOfMeasure[] = [];
  @Output() productSelected = new EventEmitter<ProductComplete>();
  @Output() productClean = new EventEmitter<number>();
  @Output() printRequested = new EventEmitter<void>();
  @ViewChild('productsPrint') productsPrintComponent!: ProductsPrintComponent;
  private readonly _productsService: ProductsService = inject(ProductsService);
  private readonly _earningService: EarningService = inject(EarningService);
  private readonly _activatedRoute: ActivatedRoute = inject(ActivatedRoute);
  private readonly _router = inject(Router);
  private readonly _matDialog: MatDialog = inject(MatDialog);
  private readonly _authService: AuthService = inject(AuthService);
  private readonly _platformId = inject(PLATFORM_ID);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(SearchFieldsComponent) searchComponent!: SearchFieldsComponent;
  displayedColumns: string[] = [
    'categoryType',
    'code',
    'name',
    'amount',
    'unitOfMeasure',
    'isActive',
    'priceBuy',
    'priceSale',
    'taxeType',
    'actions'
  ];
  dataSource = new MatTableDataSource<ProductComplete>([]);
  allProducts: ProductComplete[] = [];
  totalInventory?: number;
  userLogged: UserInterface;
  form!: FormGroup;
  showClearButton: boolean = false;
  loading: boolean = false;
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
  ngOnInit(): void {
    this.loadProducts();
  }
  constructor() {
    if (isPlatformBrowser(this._platformId)) {
      this.isMobile = window.innerWidth <= 768;
    }
    if (this.isMobile) this.paginationParams.perPage = 5;
    this.userLogged = this._authService.getUserLoggedIn();
  }
  getCategoryTypeName(product: ProductComplete): string {
    const categoryTypeId = product?.categoryType?.categoryTypeId;
    const category = this.categoryTypes.find(
      (r) => r.categoryTypeId === categoryTypeId
    );
    return category?.name || 'N/A';
  }
  onSearchSubmit(values: any): void {
    this.params = values;
    this.paginationParams.page = 1;
    this.loadProducts();
  }
  onChangePagination(event: PageEvent): void {
    this.paginationParams.page = event.pageIndex + 1;
    this.paginationParams.perPage = event.pageSize;
    this.loadProducts();
  }
  onTabChange(index: number): void {
    this.selectedTabIndex = index;
  }
  onSearchChange(form: any): void {
    this.showClearButton = !!form.length;
    this.params = form?.value;
    this.paginationParams.page = 1;
    this.loadProducts();
  }
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
        this.dataSource.data = (res.data || []).sort((a, b) =>
          (a.name['es'] ?? Object.values(a.name)[0] ?? '').localeCompare(
            b.name['es'] ?? Object.values(b.name)[0] ?? ''
          )
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
  private deleteProduct(productId: number): void {
    this.loading = true;
    this._productsService.deleteProductPanel(productId).subscribe({
      next: () => {
        this.loadProducts();
        this.cleanQueryParamDelete(productId);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error en la solicitud:', error);
        this.loading = false;
      }
    });
  }
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
  cleanQueryParamDelete(id: number) {
    const queryParams = this._activatedRoute.snapshot.queryParams;
    if (queryParams['editProduct']) {
      const productId = Number(queryParams['editProduct']);
      if (productId === id) {
        this._router.navigate([], {
          queryParams: {},
          queryParamsHandling: '',
          replaceUrl: true
        });
        this.productClean.emit(id);
      }
    }
  }
  validateIfCanEditUserOrDelete(): boolean {
    const roleName = this.userLogged?.roleType?.name?.toUpperCase();
    return roleName !== 'ADMINISTRADOR' && roleName !== 'RECEPCIONISTA';
  }
  printProducts(): void {
    this._earningService.getGeneragetProductSummary().subscribe({
      next: (summary) => {
        this.totalInventory = summary.totalProductPriceSale ?? 0;
        this._productsService.getAllProducts().subscribe({
          next: (res) => {
            this.allProducts = (res.data || []).sort(
              (a: ProductComplete, b: ProductComplete) => {
                const catCompare = a.categoryType.name.localeCompare(b.categoryType.name);
                if (catCompare !== 0) return catCompare;
                return (a.name['es'] ?? Object.values(a.name)[0] ?? '').localeCompare(b.name['es'] ?? Object.values(b.name)[0] ?? '');
              }
            );
            if (!this.allProducts.length) return;
            setTimeout(() => this.productsPrintComponent.print(), 0);
          }
        });
      }
    });
  }
}
