import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
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
  TaxeType,
  DiscountType,
  AdditionalType
} from '../../../shared/interfaces/relatedDataGeneral';
import { AccommodationsService } from '../../../service-and-product/services/accommodations.service';
import {
  AddedAccommodationInvoiceDetaill,
  CreateInvoiceDetaill
} from '../../interface/invoiceDetaill.interface';
import { PendingInvoiceDetail } from '../../interface/pending-item.interface';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { CurrencyFormatDirective } from '../../../shared/directives/currency-format.directive';
import { InvoiceDetaillService } from '../../services/invoiceDetaill.service';

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
    MatProgressSpinnerModule,
    MatTimepickerModule,
    CurrencyFormatDirective
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './add-accommodation.component.html',
  styleUrl: './add-accommodation.component.scss'
})
export class AddAccommodationComponent implements OnInit {
  @Input() categoryTypes: CategoryType[] = [];
  @Input() taxeTypes: TaxeType[] = [];
  @Input() additionalTypes: AdditionalType[] = [];
  @Input() discountTypes: DiscountType[] = [];
  @Input() saveToBackend: boolean = true;
  @Output() itemSaved = new EventEmitter<void>();
  @Output() pendingItem = new EventEmitter<PendingInvoiceDetail>();

  private readonly _accommodationsService: AccommodationsService = inject(
    AccommodationsService
  );
  private readonly _fb: FormBuilder = inject(FormBuilder);
  private readonly _router: Router = inject(Router);
  private readonly _cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private readonly _activateRouter: ActivatedRoute = inject(ActivatedRoute);
  private readonly _invoiceDetaillService: InvoiceDetaillService = inject(
    InvoiceDetaillService
  );

  form: FormGroup;
  isLoading: boolean = false;
  filteredAccommodations: AddedAccommodationInvoiceDetaill[] = [];
  isLoadingAccommodations: boolean = false;
  value!: Date;
  invoiceId?: number;

  originalPrice: number = 0;
  subtotal: number = 0;
  taxAmount: number = 0;
  unitPrice: number = 0;
  finalPrice: number = 0;

  parseFloat = parseFloat;

  ngOnInit() {
    const id = this._activateRouter.snapshot.paramMap.get('id');
    if (id) {
      this.invoiceId = Number(id);
    }

    this.form.valueChanges.subscribe((val) => {
      if (val.startDate && val.startTime) {
        this.form.patchValue(
          {
            startDateTime: this.combineDateAndTime(val.startDate, val.startTime)
          },
          { emitEvent: false }
        );
      }

      if (val.endDate && val.endTime) {
        this.form.patchValue(
          { endDateTime: this.combineDateAndTime(val.endDate, val.endTime) },
          { emitEvent: false }
        );
      }

      this.calculateFinalPrice();
    });
  }

  constructor() {
    const now = new Date();
    const endTime = new Date(now);
    endTime.setMinutes(endTime.getMinutes() + 5);

    this.form = this._fb.group({
      name: ['', Validators.required],
      accommodationId: [null, Validators.required],
      priceSale: [0],
      priceWithoutTax: [null, Validators.required],
      taxeTypeId: [2],
      amount: [1, [Validators.required, Validators.min(1)]],
      amountPerson: [0],
      amountBathroom: [0],

      startDate: [now, Validators.required],
      startTime: [now, Validators.required],
      endDate: [now, Validators.required],
      endTime: [endTime, Validators.required],
      startDateTime: [null, Validators.required],
      endDateTime: [null, Validators.required],

      discountTypeId: [null],
      additionalTypeId: [null],
      unitPrice: [0],
      finalPrice: [0]
    });

    this.form
      .get('name')
      ?.valueChanges.pipe(
        debounceTime(500),
        switchMap((name: string | AddedAccommodationInvoiceDetaill) => {
          if (typeof name !== 'string') return of({ data: [] });
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

  displayAccommodation(acc?: AddedAccommodationInvoiceDetaill): string {
    return acc ? acc.name : '';
  }

  resetForm() {
    const now = new Date();
    this.form.reset(
      {
        taxeTypeId: 2,
        amount: 1,
        startDate: now,
        startTime: now,
        endDate: now,
        endTime: now,
        finalPrice: 0,
        unitPrice: 0,
        discountTypeId: null,
        additionalTypeId: null,
        amountPerson: 0,
        amountBathroom: 0
      },
      { emitEvent: false }
    );

    this.originalPrice = 0;
    this.subtotal = 0;
    this.taxAmount = 0;
    this.unitPrice = 0;
    this.finalPrice = 0;

    this._router.navigate([], {
      queryParams: {},
      queryParamsHandling: '',
      replaceUrl: true
    });

    this._cdr.detectChanges();
  }

  calculateFinalPrice() {
    const formValue = this.form.value;

    let basePrice =
      typeof this.originalPrice === 'string'
        ? parseFloat(this.originalPrice)
        : this.originalPrice;

    if (formValue.discountTypeId) {
      const discount = this.discountTypes.find(
        (d) => d.discountTypeId === formValue.discountTypeId
      );
      if (discount && discount.code) {
        const discountAmount = parseFloat(discount.code);
        basePrice = basePrice - discountAmount;
      }
    }

    if (formValue.additionalTypeId) {
      const additional = this.additionalTypes.find(
        (a) => a.additionalTypeId === formValue.additionalTypeId
      );
      if (additional) {
        const additionalValue =
          typeof additional.value === 'string'
            ? parseFloat(additional.value)
            : additional.value;
        basePrice = basePrice + additionalValue;
      }
    }

    this.subtotal = basePrice;

    const selectedTax = this.taxeTypes.find(
      (t) => t.taxeTypeId === formValue.taxeTypeId
    );

    let taxPercent = 0;
    if (selectedTax && selectedTax.percentage) {
      taxPercent =
        typeof selectedTax.percentage === 'string'
          ? parseFloat(selectedTax.percentage)
          : selectedTax.percentage;
    }

    this.taxAmount = this.subtotal * taxPercent;

    this.unitPrice = this.subtotal + this.taxAmount;

    const amount = formValue.amount || 1;
    this.finalPrice = this.unitPrice * amount;

    this.form.patchValue({
      priceWithoutTax: this.subtotal,
      unitPrice: this.unitPrice,
      finalPrice: this.finalPrice
    });

    this._cdr.detectChanges();
  }

  getSelectedDiscountType(): DiscountType | undefined {
    const discountId = this.form.get('discountTypeId')?.value;
    if (!discountId) return undefined;
    return this.discountTypes.find((d) => d.discountTypeId === discountId);
  }

  getSelectedAdditionalType(): AdditionalType | undefined {
    const additionalId = this.form.get('additionalTypeId')?.value;
    if (!additionalId) return undefined;
    return this.additionalTypes.find(
      (a) => a.additionalTypeId === additionalId
    );
  }

  getSelectedTaxType(): TaxeType | undefined {
    const taxId = this.form.get('taxeTypeId')?.value;
    if (!taxId) return undefined;
    return this.taxeTypes.find((t) => t.taxeTypeId === taxId);
  }

  getDiscountAmount(): number {
    const discount = this.getSelectedDiscountType();
    if (!discount || !discount.code) return 0;

    return parseFloat(discount.code);
  }

  getAdditionalAmount(): number {
    const additional = this.getSelectedAdditionalType();
    if (!additional) return 0;
    return typeof additional.value === 'string'
      ? parseFloat(additional.value)
      : additional.value;
  }

  getTaxPercentage(): number {
    const tax = this.getSelectedTaxType();
    if (!tax || !tax.percentage) return 0;
    return typeof tax.percentage === 'string'
      ? parseFloat(tax.percentage) * 100
      : tax.percentage * 100;
  }

  combineDateAndTime(date: Date, time: Date): Date {
    const d = new Date(date);
    const t = new Date(time);
    d.setHours(t.getHours(), t.getMinutes(), 0, 0);
    return d;
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

  onAccommodationSelected(acc: AddedAccommodationInvoiceDetaill) {
    if (!acc) return;

    const price =
      acc.priceSale && !isNaN(Number(acc.priceSale))
        ? Number(acc.priceSale)
        : 0;
    this.originalPrice = price;

    this.form.patchValue({
      name: acc,
      accommodationId: acc.accommodationId,
      amountPerson: acc.amountPerson ?? 0,
      amountBathroom: acc.amountBathroom ?? 0,
      priceSale: price
    });

    this.calculateFinalPrice();
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

  clearAccommodationSelection(): void {
    this.resetForm();
    this.filteredAccommodations = [];
    this._cdr.detectChanges();
  }

  addAccommodation(): void {
    if (!this.form.value.accommodationId) {
      this.form.get('name')?.setErrors({ required: true });
      this.form.markAllAsTouched();
      return;
    }

    if (this.form.valid) {
      const formValue = this.form.value;

      const priceToSend =
        this.subtotal && !isNaN(this.subtotal) && this.subtotal > 0
          ? this.subtotal
          : 0;

      const invoiceDetailPayload: CreateInvoiceDetaill = {
        productId: 0,
        excursionId: 0,
        accommodationId: formValue.accommodationId,
        amount: formValue.amount,
        priceBuy: Number(formValue.priceBuy) || 0,
        priceWithoutTax: Number(priceToSend),
        taxeTypeId: formValue.taxeTypeId,
        startDate: new Date(formValue.startDateTime).toISOString(),
        endDate: new Date(formValue.endDateTime).toISOString()
      };

      if (!this.saveToBackend) {
        const pendingItem: PendingInvoiceDetail = {
          id: crypto.randomUUID(),
          type: 'Hospedaje',
          name: formValue.name?.name || 'Hospedaje',
          payload: invoiceDetailPayload
        };
        this.pendingItem.emit(pendingItem);
        this.resetForm();
        return;
      }

      if (!this.invoiceId) {
        console.error('❌ No hay invoiceId definido');
        return;
      }

      this.isLoading = true;
      this._invoiceDetaillService
        .createInvoiceDetaill(this.invoiceId, [invoiceDetailPayload])
        .subscribe({
          next: () => {
            this.resetForm();
            this.isLoading = false;
            this.itemSaved.emit();
          },
          error: (err) => {
            console.error('❌ Error al guardar detalle:', err);
            this.isLoading = false;
          }
        });
    }
  }
}
