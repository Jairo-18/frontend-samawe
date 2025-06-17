import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
  inject
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { debounceTime, of, switchMap } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CategoryType,
  TaxeType
} from '../../../shared/interfaces/relatedDataGeneral';
import { InvoiceDetaillService } from '../../services/invoiceDetaill.service';
import { AccommodationsService } from '../../../service-and-product/services/accommodations.service';
import { AddedAccommodationInvoiceDetaill } from '../../interface/invoiceDetaill.interface';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-add-accommodation',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
    MatAutocompleteModule,
    MatOptionModule,
    CommonModule,
    MatSelectModule,
    MatNativeDateModule,
    MatDatepickerModule,
    MatIcon,
    MatProgressSpinnerModule
  ],
  templateUrl: './add-accommodation.component.html',
  styleUrl: './add-accommodation.component.scss'
})
export class AddAccommodationComponent {
  @Input() categoryTypes: CategoryType[] = [];
  @Input() taxeTypes: TaxeType[] = [];
  @Output() accommodationAdded = new EventEmitter<void>();

  private readonly _accommodationsService: AccommodationsService = inject(
    AccommodationsService
  );
  private readonly _invoiceDetaillService: InvoiceDetaillService = inject(
    InvoiceDetaillService
  );
  private readonly route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private readonly _router: Router = inject(Router);

  form: FormGroup;
  isLoading = false;
  filteredAccommodations: AddedAccommodationInvoiceDetaill[] = [];

  constructor(private cdr: ChangeDetectorRef) {
    const now = new Date();
    const nowLocal = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    this.form = this.fb.group({
      accommodationName: ['', Validators.required],
      accommodationId: [null, Validators.required],
      price: [{ value: '', disabled: true }],
      amount: [1, [Validators.required, Validators.min(1)]],
      taxeTypeId: [null, Validators.required],
      startDate: [nowLocal, Validators.required],
      endDate: [nowLocal, Validators.required]
    });

    this.form
      .get('accommodationName')
      ?.valueChanges.pipe(
        debounceTime(500),
        switchMap((name: string) => {
          if (!name || name.trim().length < 2) return of({ data: [] });
          return this._accommodationsService.getAccommodationWithPagination({
            name
          });
        })
      )
      .subscribe((res) => {
        this.filteredAccommodations = res.data ?? [];
      });
  }

  onAccommodationFocus() {
    if (!this.filteredAccommodations.length) {
      this._accommodationsService
        .getAccommodationWithPagination({})
        .subscribe((res) => {
          this.filteredAccommodations = res.data ?? [];
        });
    }
  }

  onAccommodationSelected(name: string) {
    const acc = this.filteredAccommodations.find((a) => a.name === name);
    if (!acc) return;

    this.form.patchValue({
      accommodationId: acc.accommodationId,
      price: acc.priceSale,
      taxeTypeId: acc.taxeTypeId
    });
  }

  private getInvoiceIdFromRoute(route: ActivatedRoute): string | null {
    let current = route;
    while (current) {
      const id = current.snapshot.paramMap.get('id');
      if (id) return id;
      current = current.parent!;
    }
    return null;
  }

  resetForm() {
    const now = new Date();
    const nowLocal = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    this.form.reset();
    Object.keys(this.form.controls).forEach((key) => {
      const control = this.form.get(key);
      control?.setErrors(null);
    });

    this.form.patchValue({
      amount: 1,
      startDate: nowLocal,
      endDate: nowLocal
    });

    this._router.navigate([], {
      queryParams: {},
      queryParamsHandling: '',
      replaceUrl: true
    });

    this.cdr.detectChanges();
  }

  addAccommodation() {
    if (this.form.valid) {
      const invoiceId = this.getInvoiceIdFromRoute(this.route);
      if (!invoiceId) {
        console.error('Invoice ID not found!');
        return;
      }
      this.isLoading = true;
      const f = this.form.getRawValue(); // 👈 importante cambio aquí

      const payload = {
        productId: 0,
        excursionId: 0,
        accommodationId: f.accommodationId,
        amount: f.amount,
        priceBuy: f.priceBuy,
        priceWithoutTax: Number(f.price),
        taxeTypeId: f.taxeTypeId,
        startDate: new Date(f.startDate).toISOString(),
        endDate: new Date(f.endDate).toISOString()
      };

      this._invoiceDetaillService
        .createInvoiceDetaill(+invoiceId, payload)
        .subscribe({
          next: () => {
            this.isLoading = false;
            this.accommodationAdded.emit();
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
