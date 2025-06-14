import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
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
import { ActivatedRoute } from '@angular/router';
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
    MatIcon
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

  form: FormGroup;
  filteredAccommodations: AddedAccommodationInvoiceDetaill[] = [];

  constructor() {
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

  addAccommodation() {
    if (this.form.valid) {
      const invoiceId = this.getInvoiceIdFromRoute(this.route);
      if (!invoiceId) {
        console.error('Invoice ID not found!');
        return;
      }

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
            this.accommodationAdded.emit();
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
