import { CategoryType } from './../../interface/product.interface';
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RelatedDataService } from '../../../shared/services/relatedData.service';
import { CustomValidationsService } from '../../../shared/validators/customValidations.service';
import { ProductsService } from '../../services/products.service';
import { CreateProductPanel } from '../../interface/product.interface';
import { CurrencyFormatDirective } from '../../../shared/directives/currency-format.directive';

@Component({
  selector: 'app-create-products-or-edit-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    NgFor,
    MatButtonModule,
    FontAwesomeModule,
    MatIcon,
    RouterLink,
    CurrencyFormatDirective
  ],
  templateUrl: './create-products-or-edit-products.component.html',
  styleUrl: './create-products-or-edit-products.component.scss'
})
export class CreateProductsOrEditProductsComponent implements OnInit {
  productForm: FormGroup;
  productId: number = 0;
  categoryType: CategoryType[] = [];
  isEditMode: boolean = false;

  private readonly _productsService: ProductsService = inject(ProductsService);
  private readonly _relatedDataService: RelatedDataService =
    inject(RelatedDataService);
  private readonly _customValidations: CustomValidationsService = inject(
    CustomValidationsService
  );
  private readonly _activatedRoute: ActivatedRoute = inject(ActivatedRoute);
  private readonly _router: Router = inject(Router);

  constructor(private _fb: FormBuilder) {
    this.productForm = this._fb.group({
      categoryTypeId: [null, [Validators.required]],
      name: ['', [Validators.required]],
      description: ['', [Validators.maxLength(250)]],
      amount: [
        null,
        [Validators.required, Validators.pattern(/^\d+$/), Validators.min(0)]
      ],
      priceBuy: [
        null,
        [
          Validators.required,
          Validators.pattern(/^\d+(\.\d{1,2})?$/),
          Validators.min(0.01)
        ]
      ],
      priceSale: [null, [Validators.required, Validators.min(0.01)]]
    });
  }

  ngOnInit(): void {
    this.getRelatedData();
    this.productId = this._activatedRoute.snapshot.params['id'];
    this.isEditMode = !!this.productId;

    if (this.isEditMode) {
      this.getProductToEdit(this.productId);
    }
  }

  private getProductToEdit(productId: number): void {
    this._productsService.getProductEditPanel(productId).subscribe({
      next: (res) => {
        const product = res.data;

        this.productForm.patchValue({
          productId: product.productId,
          categoryTypeId: product.categoryType?.categoryTypeId,
          name: product.name,
          description: product.description,
          amount: product.amount,
          priceBuy: product.priceBuy,
          priceSale: product.priceSale
        });
      },
      error: (err) => {
        console.error('Error al obtener usuario:', err.error?.message || err);
      }
    });
  }

  /**
   * @param getRelatedData - Obtiene los tipos de categoría.
   */
  getRelatedData(): void {
    this._relatedDataService.createProductRelatedData().subscribe({
      next: (res) => {
        this.categoryType = res.data?.categoryType || [];
      },
      error: (error) =>
        console.error('Error al cargar datos relacionados:', error)
    });
  }

  save() {
    if (this.productForm.valid) {
      const formValue = this.productForm.value;
      const userSave: CreateProductPanel = {
        productId: this.isEditMode ? this.productId : 0, // En creación envía 0 (o valor temporal)
        categoryTypeId: formValue.categoryTypeId,
        name: formValue.name,
        description: formValue.description,
        amount: Math.trunc(Number(formValue.amount)), // Asegurar que sea entero
        priceBuy: Math.abs(Number(formValue.priceBuy)), // Asegurar positivo
        priceSale: Math.abs(Number(formValue.priceSale))
      };
      if (this.productId) {
        if (this.productForm.invalid) return;
        delete userSave.productId;
        this._productsService
          .updateProductPanel(this.productId, userSave)
          .subscribe({
            next: () => {
              this._router.navigateByUrl('/products/product/list');
            },
            error: (error) => {
              console.error('Error al actualizar el usuario', error);
            }
          });
      } else {
        this._productsService.createProductPanel(userSave).subscribe({
          next: () => {
            this._router.navigateByUrl('/products/product/list');
          },
          error: (err) => {
            if (err.error && err.error.message) {
              console.error('Error al registrar usuario:', err.error.message);
            } else {
              console.error('Error desconocido:', err);
            }
          }
        });
      }
    } else {
      console.error('Formulario no válido', this.productForm);
      this.productForm.markAllAsTouched();
    }
  }
}
