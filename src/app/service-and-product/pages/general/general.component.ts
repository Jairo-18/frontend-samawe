import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { SeeProductsComponent } from '../../components/see-products/see-products.component';
import { ActivatedRoute } from '@angular/router';
import { ProductComplete } from '../../interface/product.interface';
import { RelatedDataService } from '../../../shared/services/relatedData.service';
import { SearchField } from '../../../shared/interfaces/search.interface';
import { CreateOrEditProductComponent } from '../../components/create-or-edit-product/create-or-edit-product.component';
import { CreateOrEditExcursionComponent } from '../../components/create-or-edit-excursion/create-or-edit-excursion.component';
import { SeeExcursionsComponent } from '../../components/see-excursions/see-excursions.component';
import { CreateOrEditAccommodationComponent } from '../../components/create-or-edit-accommodation/create-or-edit-accommodation.component';
import { SeeAccommodationsComponent } from '../../components/see-accommodations/see-accommodations.component';
import {
  BedType,
  CategoryType,
  StateType
} from '../../../shared/interfaces/relatedDataServiceAndProduct.interface';
import { AccommodationComplete } from '../../interface/accommodation.interface';

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
  currentAccommodation?: AccommodationComplete;
  categoryTypes: CategoryType[] = [];
  stateTypes: StateType[] = [];
  bedTypes: BedType[] = [];

  constructor(
    private _route: ActivatedRoute,
    private _relatedDataService: RelatedDataService
  ) {}

  cleanProduct() {
    this.createOrEditProductComponent.resetForm();
  }

  ngAfterViewInit() {
    this._route.queryParams.subscribe((params) => {
      if (params['editProduct']) {
        this.tabGroup.selectedIndex = 0;
      }
    });
  }

  searchFieldsProducts: SearchField[] = [
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

  searchFieldsAccommodations: SearchField[] = [];
  searchFieldsExcursions: SearchField[] = [];

  ngOnInit(): void {
    this.loadRelatedData();
  }

  loadRelatedData(): void {
    this._relatedDataService.createProductRelatedData().subscribe({
      next: (res) => {
        this.categoryTypes = res.data?.categoryType || [];
        this.updateCategoryTypeOptions();
      },
      error: (err) => console.error('Error productos:', err)
    });

    this._relatedDataService.createAccommodationRelatedData().subscribe({
      next: (res) => {
        // ¡No sobreescribas categoryTypes aquí!
        this.stateTypes = res.data?.stateType || [];
        this.bedTypes = res.data?.bedType || [];
      },
      error: (err) => console.error('Error hospedajes:', err)
    });
  }

  updateCategoryTypeOptions(): void {
    const updateOptions = (
      searchFields: SearchField[],
      fieldName: string,
      options: { value: number; label: string }[]
    ) => {
      const field = searchFields.find((f) => f.name === fieldName);
      if (field) {
        field.options = options;
      }
    };

    // Category Type
    const categoryOptions = this.categoryTypes.map((type) => ({
      value: type.categoryTypeId,
      label: type.name || ''
    }));
    updateOptions(this.searchFieldsProducts, 'categoryType', categoryOptions);
    updateOptions(this.searchFieldsExcursions, 'categoryType', categoryOptions);
    updateOptions(
      this.searchFieldsAccommodations,
      'categoryType',
      categoryOptions
    );

    // State Type
    const stateOptions = this.stateTypes.map((type) => ({
      value: type.stateTypeId,
      label: type.name || ''
    }));
    updateOptions(this.searchFieldsExcursions, 'stateType', stateOptions);
    updateOptions(this.searchFieldsAccommodations, 'stateType', stateOptions);

    // Bed Type
    const bedOptions = this.bedTypes.map((type) => ({
      value: type.bedTypeId,
      label: type.name || ''
    }));
    updateOptions(this.searchFieldsAccommodations, 'bedType', bedOptions);
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
