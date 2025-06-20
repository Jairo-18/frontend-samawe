import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  CategoryType,
  TaxeType
} from '../../../shared/interfaces/relatedDataGeneral';
import { CreateProductPanel } from '../../../service-and-product/interface/product.interface';
import { ProductsService } from '../../../service-and-product/services/products.service';
import { debounceTime, of, switchMap } from 'rxjs';
import { MatOptionModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { InvoiceDetaillService } from '../../services/invoiceDetaill.service';
import { ActivatedRoute } from '@angular/router';
import { AddedProductInvoiceDetaill } from '../../interface/invoiceDetaill.interface';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
    MatOptionModule,
    MatAutocompleteModule,
    CommonModule,
    MatSelectModule,
    MatIcon
  ],
  templateUrl: './add-product.component.html',
  styleUrl: './add-product.component.scss'
})
export class AddProductComponent {
  @Input() categoryTypes: CategoryType[] = [];
  @Input() taxeTypes: TaxeType[] = [];
  @Output() productAdded = new EventEmitter<void>();

  private readonly _productsService: ProductsService = inject(ProductsService);
  private readonly _invoiceDetaillService: InvoiceDetaillService = inject(
    InvoiceDetaillService
  );
  private readonly route = inject(ActivatedRoute);

  form: FormGroup;
  filteredProducts: AddedProductInvoiceDetaill[] = [];
  selectedProduct?: CreateProductPanel;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      productName: ['', Validators.required],
      productId: [null, Validators.required],
      price: [{ value: '', disabled: true }],
      priceBuy: [0, [Validators.required, Validators.min(0)]], // Aseguramos número válido
      priceWithoutTax: [null, Validators.required],
      taxeTypeId: [null, Validators.required],
      amount: [1, [Validators.required, Validators.min(1)]],
      categoryId: [null, Validators.required]
    });

    this.form
      .get('productName')
      ?.valueChanges.pipe(
        debounceTime(500),
        switchMap((name: string) => {
          if (!name || name.trim().length < 2) {
            return of({ data: [] });
          }
          return this._productsService.getProductWithPagination({ name });
        })
      )
      .subscribe((res) => {
        this.filteredProducts = res.data ?? [];
      });
  }

  getInvoiceIdFromRoute(route: ActivatedRoute): string | null {
    let currentRoute: ActivatedRoute | null = route;
    while (currentRoute) {
      const id = currentRoute.snapshot.paramMap.get('id');
      if (id) return id;
      currentRoute = currentRoute.parent;
    }
    return null;
  }

  onProductFocus() {
    if (!this.filteredProducts.length) {
      this._productsService.getProductWithPagination({}).subscribe((res) => {
        this.filteredProducts = res.data ?? [];
      });
    }
  }

  onProductSelected(name: string) {
    const product = this.filteredProducts.find((p) => p.name === name);
    if (!product) return;

    this.selectedProduct = product;

    this.form.patchValue({
      productId: product.productId,
      price: product.priceSale,
      priceBuy: product.priceBuy ?? 0, // Aseguramos número si viene null
      priceWithoutTax: product.priceSale,
      taxeTypeId: product.taxeTypeId,
      categoryId: product.categoryTypeId
    });
  }

  addProduct() {
    if (this.form.valid) {
      const invoiceId = this.getInvoiceIdFromRoute(this.route);
      if (!invoiceId) {
        console.error('Invoice ID not found in route!');
        return;
      }

      const formValue = this.form.value;

      const invoiceDetailPayload = {
        productId: formValue.productId,
        accommodationId: 0,
        excursionId: 0,
        amount: formValue.amount,
        priceBuy: Number(formValue.priceBuy) || 0,
        priceWithoutTax: Number(formValue.priceWithoutTax),
        taxeTypeId: formValue.taxeTypeId,
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString()
      };

      this._invoiceDetaillService
        .createInvoiceDetaill(+invoiceId, invoiceDetailPayload)
        .subscribe({
          next: () => {
            this.productAdded.emit();
          },
          error: (err) => {
            console.error('Error al agregar detalle:', err);
          }
        });
    } else {
      console.log('Formulario inválido');
      this.form.markAllAsTouched();
    }
  }
}
