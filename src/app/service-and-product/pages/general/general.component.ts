import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { SeeProductsComponent } from '../../components/see-products/see-products.component';
import { ActivatedRoute } from '@angular/router';
import {
  CategoryType,
  ProductComplete
} from '../../interface/product.interface';
import { RelatedDataService } from '../../../shared/services/relatedData.service';
import { SearchField } from '../../../shared/interfaces/search.interface';
import { CreateOrEditProductComponent } from '../../components/create-or-edit-product/create-or-edit-product.component';
import { CreateOrEditExcursionComponent } from '../../components/create-or-edit-excursion/create-or-edit-excursion.component';
import { SeeExcursionsComponent } from '../../components/see-excursions/see-excursions.component';
import { CreateOrEditAccommodationComponent } from '../../components/create-or-edit-accommodation/create-or-edit-accommodation.component';
import { SeeAccommodationsComponent } from '../../components/see-accommodations/see-accommodations.component';

@Component({
  selector: 'app-general',
  standalone: true,
  imports: [
    MatTabsModule,
    SeeProductsComponent,
    CreateOrEditProductComponent,
    CreateOrEditExcursionComponent,
    SeeExcursionsComponent,
    CreateOrEditAccommodationComponent,
    SeeAccommodationsComponent
  ],
  templateUrl: './general.component.html',
  styleUrl: './general.component.scss'
})
export class GeneralComponent implements AfterViewInit, OnInit {
  @ViewChild(MatTabGroup) tabGroup!: MatTabGroup;
  @ViewChild(SeeProductsComponent) seeProductsComponent!: SeeProductsComponent;
  @ViewChild(CreateOrEditProductComponent)
  createOrEditProductComponent!: CreateOrEditProductComponent;

  currentProduct?: ProductComplete;

  constructor(
    private route: ActivatedRoute,
    private _relatedDataService: RelatedDataService
  ) {}

  cleanProduct() {
    this.createOrEditProductComponent.resetForm();
  }

  ngAfterViewInit() {
    this.route.queryParams.subscribe((params) => {
      if (params['editProduct']) {
        this.tabGroup.selectedIndex = 0;
      }
    });
  }

  categoryTypes: CategoryType[] = [];
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

  ngOnInit(): void {
    this.loadRelatedData();
  }

  loadRelatedData(): void {
    this._relatedDataService.createProductRelatedData().subscribe({
      next: (res) => {
        this.categoryTypes = res.data?.categoryType || [];
        this.updateCategoryTypeOptions(); // Actualizar las opciones para los hijos
      },
      error: (error) => {
        console.error('Error al cargar datos relacionados en el padre:', error);
        // Manejar el error apropiadamente
      }
    });
  }

  updateCategoryTypeOptions(): void {
    const categoryTypeOption = this.searchFields.find(
      (field) => field.name === 'categoryType'
    );

    if (categoryTypeOption) {
      categoryTypeOption.options = this.categoryTypes.map((type) => ({
        value: type.categoryTypeId,
        label: type.name || ''
      }));
    }
  }

  reloadProducts(): void {
    if (this.seeProductsComponent && this.seeProductsComponent.loadProducts) {
      this.seeProductsComponent.loadProducts();
    } else {
      console.warn(
        'SeeProductsComponent o su método loadProducts no están disponibles.'
      );
    }
  }
}
