import { SeeExcursionsComponent } from './../../components/see-excursions/see-excursions.component';
import { SeeAccommodationsComponent } from './../../components/see-accommodations/see-accommodations.component';
import { CreateOrEditAccommodationComponent } from './../../components/create-or-edit-accommodation/create-or-edit-accommodation.component';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { SeeProductsComponent } from '../../components/see-products/see-products.component';
import { ActivatedRoute } from '@angular/router';
import { ProductComplete } from '../../interface/product.interface';
import { RelatedDataService } from '../../../shared/services/relatedData.service';
import { SearchField } from '../../../shared/interfaces/search.interface';
import { CreateOrEditProductComponent } from '../../components/create-or-edit-product/create-or-edit-product.component';
import { CreateOrEditExcursionComponent } from '../../components/create-or-edit-excursion/create-or-edit-excursion.component';
import {
  BedType,
  CategoryType,
  StateType
} from '../../../shared/interfaces/relatedDataServiceAndProduct.interface';
import { AccommodationComplete } from '../../interface/accommodation.interface';
import {
  searchFieldsAccommodations,
  searchFieldsExcursions,
  searchFieldsProducts
} from '../../constants/searchFields.constants';
import { ExcursionComplete } from '../../interface/excursion.interface';

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
  @ViewChild(SeeAccommodationsComponent)
  seeAccommodationsComponent!: SeeAccommodationsComponent;
  @ViewChild(SeeExcursionsComponent)
  seeExcursionComponent!: SeeExcursionsComponent;

  @ViewChild(CreateOrEditProductComponent)
  createOrEditProductComponent!: CreateOrEditProductComponent;
  @ViewChild(CreateOrEditAccommodationComponent)
  createOrEditAccommodationComponent!: CreateOrEditAccommodationComponent;
  @ViewChild(CreateOrEditExcursionComponent)
  createOrEditExcursionComponent!: CreateOrEditExcursionComponent;

  currentProduct?: ProductComplete;
  currentAccommodation?: AccommodationComplete;
  currentExcursion?: ExcursionComplete;
  categoryTypes: CategoryType[] = [];
  stateTypes: StateType[] = [];
  bedTypes: BedType[] = [];
  searchFieldsProducts: SearchField[] = searchFieldsProducts;
  searchFieldsAccommodations: SearchField[] = searchFieldsAccommodations;
  searchFieldsExcursions: SearchField[] = searchFieldsExcursions;

  constructor(
    private _route: ActivatedRoute,
    private _relatedDataService: RelatedDataService
  ) {}

  ngOnInit(): void {
    // this._route.queryParams.subscribe(() => {
    //   this.tabGroup.selectedIndex = 1;
    // });
    this.loadRelatedData();
  }

  ngAfterViewInit() {
    this._route.queryParams.subscribe((params) => {
      if (params['editProduct']) {
        this.tabGroup.selectedIndex = 0;
      }
    });
    this._route.queryParams.subscribe((params) => {
      if (params['editExcursion']) {
        this.tabGroup.selectedIndex = 1;
      }
    });
    this._route.queryParams.subscribe((params) => {
      if (params['editAccommodation']) {
        this.tabGroup.selectedIndex = 2;
      }
    });
  }

  goToTop(): void {
    const main = document.querySelector('main');
    if (main) {
      main.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }

  cleanProduct() {
    this.createOrEditProductComponent.resetForm();
  }
  cleanAccommodation() {
    this.createOrEditAccommodationComponent.resetForm();
  }
  cleanExcursion() {
    this.createOrEditExcursionComponent.resetForm();
  }

  loadRelatedData(): void {
    this._relatedDataService.createAccommodationRelatedData().subscribe({
      next: (res) => {
        this.categoryTypes = res.data?.categoryType || [];
        this.stateTypes = res.data?.stateType || [];
        this.bedTypes = res.data?.bedType || [];

        this.updateCategoryTypeOptions();
      },
      error: (err) => console.error('Error al cargar datos de select:', err)
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

  reloadAccommodations(): void {
    if (
      this.seeAccommodationsComponent &&
      this.seeAccommodationsComponent.loadAccommodations
    ) {
      this.seeAccommodationsComponent.loadAccommodations();
    } else {
      console.warn(
        'SeeProductsComponent o su método loadProducts no están disponibles.'
      );
    }
  }

  reloadExcursion(): void {
    if (
      this.seeExcursionComponent &&
      this.seeExcursionComponent.loadExcursions
    ) {
      this.seeExcursionComponent.loadExcursions();
    } else {
      console.warn(
        'SeeProductsComponent o su método loadProducts no están disponibles.'
      );
    }
  }
}
