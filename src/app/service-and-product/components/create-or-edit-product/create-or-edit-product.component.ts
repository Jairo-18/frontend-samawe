import { ProductComplete } from '../../interface/product.interface';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges
} from '@angular/core';
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
import { ActivatedRoute, Router } from '@angular/router';
import { ProductsService } from '../../services/products.service';
import { CreateProductPanel } from '../../interface/product.interface';
import { CurrencyFormatDirective } from '../../../shared/directives/currency-format.directive';
import { CategoryType } from '../../../shared/interfaces/relatedDataServiceAndProduct.interface';

@Component({
  selector: 'app-create-or-edit-product',
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
    CurrencyFormatDirective
  ],
  templateUrl: './create-or-edit-product.component.html',
  styleUrl: './create-or-edit-product.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateOrEditProductComponent implements OnChanges {
  @Input() categoryTypes: CategoryType[] = [];
  @Input() currentProduct?: ProductComplete;
  @Output() productSaved = new EventEmitter<void>();

  productForm: FormGroup;
  productId: number = 0;
  isEditMode: boolean = false;

  private readonly _productsService: ProductsService = inject(ProductsService);
  private readonly _activatedRoute: ActivatedRoute = inject(ActivatedRoute);
  private readonly _router: Router = inject(Router);

  constructor(private _fb: FormBuilder, private cdr: ChangeDetectorRef) {
    this.productForm = this._fb.group({
      categoryTypeId: [
        this.currentProduct?.categoryType?.categoryTypeId,
        [Validators.required]
      ],
      code: [
        this.currentProduct?.code,
        [Validators.required, Validators.pattern(/^\d+$/), Validators.min(0)]
      ],
      name: [this.currentProduct?.name, [Validators.required]],
      description: [
        this.currentProduct?.description,
        [Validators.maxLength(250)]
      ],
      amount: [
        this.currentProduct?.amount,
        [Validators.required, Validators.pattern(/^\d+$/), Validators.min(0)]
      ],
      priceBuy: [
        this.currentProduct?.priceBuy,
        [
          Validators.required,
          Validators.pattern(/^\d+(\.\d{1,2})?$/),
          Validators.min(0.01)
        ]
      ],
      priceSale: [
        this.currentProduct?.priceSale,
        [Validators.required, Validators.min(0.01)]
      ]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentProduct']) {
      if (!this.currentProduct) {
        const queryParams = this._activatedRoute.snapshot.queryParams;
        if (queryParams['editProduct']) {
          this.productId = Number(queryParams['editProduct']);
          this.isEditMode = true;
          this.getProductToEdit(this.productId);
        }
      } else {
        this.productId = this.currentProduct.productId;
        this.productForm.patchValue(this.currentProduct);
        this.isEditMode = true;
      }
    }
  }

  resetForm() {
    this.productForm.reset();
    Object.keys(this.productForm.controls).forEach((key) => {
      const control = this.productForm.get(key);
      control?.setErrors(null);
    });
    this.isEditMode = false;
    this._router.navigate(
      [], // La misma ruta actual (segmentos de ruta)
      {
        queryParams: {}, // Pasa un objeto vacío para eliminar los query parameters
        queryParamsHandling: '', // 'merge' es el comportamiento predeterminado, pero explícito por claridad
        replaceUrl: true // Importante: Reemplaza la URL actual en el historial sin recargar
      }
    );
    this.cdr.detectChanges();
  }

  private getProductToEdit(productId: number): void {
    this._productsService.getProductEditPanel(productId).subscribe({
      next: (res) => {
        const product = res.data;
        // Aseguramos que el productId esté correctamente configurado
        this.productId = product.productId; // Asegúrate de que el productId se establezca aquí

        this.productForm.patchValue({
          categoryTypeId: product.categoryType?.categoryTypeId,
          code: product.code,
          name: product.name,
          description: product.description,
          amount: product.amount,
          priceBuy: product.priceBuy,
          priceSale: product.priceSale
        });
      },
      error: (err) => {
        console.error('Error al obtener producto:', err.error?.message || err);
      }
    });
  }

  save() {
    if (this.productForm.valid) {
      const formValue = this.productForm.value;

      // Creamos un objeto base con todos los campos necesarios
      const productSave: CreateProductPanel = {
        productId: this.isEditMode ? this.productId : undefined,
        code: Math.trunc(Number(formValue.code)),
        categoryTypeId: formValue.categoryTypeId,
        name: formValue.name,
        description: formValue.description,
        amount: Math.trunc(Number(formValue.amount)),
        priceBuy: Math.abs(Number(formValue.priceBuy)),
        priceSale: Math.abs(Number(formValue.priceSale))
      };

      if (this.isEditMode) {
        // Para actualizar, podemos quitar el productId del objeto que enviamos
        const updateData = { ...productSave };
        delete updateData.productId; // Lo quitamos para la actualización

        this._productsService
          .updateProductPanel(this.productId, updateData)
          .subscribe({
            next: () => {
              this.productSaved.emit();
              this.resetForm();
              // this._router.navigateByUrl('/service-and-product/general');
            },
            error: (error) => {
              console.error('Error al actualizar el producto', error);
            }
          });
      } else {
        // Para crear, enviamos el objeto completo con productId = 0
        this._productsService.createProductPanel(productSave).subscribe({
          next: () => {
            this.productSaved.emit();
            this.resetForm();
            // this._router.navigateByUrl('/service-and-product/general');
          },
          error: (err) => {
            if (err.error && err.error.message) {
              console.error('Error al registrar producto:', err.error.message);
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
