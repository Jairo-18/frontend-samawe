import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  OnInit
} from '@angular/core';
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
import { ProductsService } from '../../../service-and-product/services/products.service';
import { debounceTime, of, switchMap } from 'rxjs';
import { MatOptionModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { InvoiceDetaillService } from '../../services/invoiceDetaill.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AddedProductInvoiceDetaill } from '../../interface/invoiceDetaill.interface';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

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
    MatIcon,
    MatProgressSpinnerModule
  ],
  templateUrl: './add-product.component.html',
  styleUrl: './add-product.component.scss'
})
export class AddProductComponent implements OnInit {
  @Input() categoryTypes: CategoryType[] = [];
  @Input() taxeTypes: TaxeType[] = [];
  @Output() productAdded = new EventEmitter<void>();

  private readonly _producsService: ProductsService = inject(ProductsService);
  private readonly _invoiceDetaillService: InvoiceDetaillService = inject(
    InvoiceDetaillService
  );
  private readonly _route: ActivatedRoute = inject(ActivatedRoute);
  private readonly _router: Router = inject(Router);
  private readonly _cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private readonly _fb: FormBuilder = inject(FormBuilder);

  form: FormGroup;
  isLoading: boolean = false;
  filteredProducts: AddedProductInvoiceDetaill[] = [];

  constructor() {
    this.form = this._fb.group({
      productName: ['', Validators.required],
      productId: [null, Validators.required],
      price: [{ value: '', disabled: true }],
      priceBuy: [0, [Validators.required, Validators.min(0)]],
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
          return this._producsService.getProductWithPagination({ name });
        })
      )
      .subscribe((res) => {
        this.filteredProducts = res.data ?? [];
      });
  }

  ngOnInit(): void {
    const ivaTaxe = this.taxeTypes.find((t) => t.name === 'IVA');
    if (ivaTaxe) {
      this.form.patchValue({ taxeTypeId: ivaTaxe.taxeTypeId });
    }
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

  onProductFocus(): void {
    if (!this.filteredProducts.length) {
      this._producsService.getProductWithPagination({}).subscribe((res) => {
        this.filteredProducts = res.data ?? [];
      });
    }
  }

  onProductSelected(name: string): void {
    const product = this.filteredProducts.find((p) => p.name === name);
    if (!product) return;

    this.form.patchValue({
      productId: product.productId,
      price: product.priceSale,
      priceBuy: product.priceBuy ?? 0,
      priceWithoutTax: product.priceSale,
      // No toques taxeTypeId
      categoryId: product.categoryTypeId
    });
  }

  resetForm(): void {
    const ivaTaxe = this.taxeTypes.find((t) => t.name === 'IVA');

    this.form.reset({
      productName: '',
      productId: null,
      price: { value: '', disabled: true },
      priceBuy: 0,
      priceWithoutTax: null,
      taxeTypeId: ivaTaxe?.taxeTypeId ?? null,
      amount: 1,
      categoryId: null
    });

    Object.keys(this.form.controls).forEach((key) => {
      const control = this.form.get(key);
      control?.setErrors(null);
    });

    this._router.navigate([], {
      queryParams: {},
      queryParamsHandling: '',
      replaceUrl: true
    });

    this._cdr.detectChanges();
  }

  addProduct(): void {
    if (this.form.valid) {
      const invoiceId = this.getInvoiceIdFromRoute(this._route);
      if (!invoiceId) {
        console.error('Invoice ID not found in route!');
        return;
      }
      this.isLoading = true;
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
            this.isLoading = false;
            this.productAdded.emit();
            this.resetForm();
          },
          error: (err) => {
            this.isLoading = false;
            console.error('Error al agregar detalle:', err);
          }
        });
    } else {
      console.log('Formulario inválido');
      this.form.markAllAsTouched();
    }
  }
}
