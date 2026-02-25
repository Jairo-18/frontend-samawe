import {
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
import {
  CategoryType,
  TaxeType
} from '../../../shared/interfaces/relatedDataGeneral';
import { InvoiceDetaillService } from '../../services/invoiceDetaill.service';
import { ExcursionsService } from '../../../service-and-product/services/excursions.service';
import {
  AddedExcursionInvoiceDetaill,
  CreateInvoiceDetaill
} from '../../interface/invoiceDetaill.interface';
import { PendingInvoiceDetail } from '../../interface/pending-item.interface';
import { debounceTime, of, switchMap } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CurrencyFormatDirective } from '../../../shared/directives/currency-format.directive';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatDatepickerModule } from '@angular/material/datepicker';
@Component({
  selector: 'app-add-excursion',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatOptionModule,
    MatButtonModule,
    CommonModule,
    MatIcon,
    MatProgressSpinnerModule,
    CurrencyFormatDirective,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTimepickerModule
  ],
  templateUrl: './add-excursion.component.html',
  styleUrl: './add-excursion.component.scss'
})
export class AddExcursionComponent implements OnInit {
  @Input() categoryTypes: CategoryType[] = [];
  @Input() taxeTypes: TaxeType[] = [];
  @Input() saveToBackend: boolean = true;
  @Output() itemSaved = new EventEmitter<void>();
  @Output() pendingItem = new EventEmitter<PendingInvoiceDetail>();
  private readonly _excursionsService = inject(ExcursionsService);
  private readonly _invoiceDetaillService = inject(InvoiceDetaillService);
  private readonly _activateRouter = inject(ActivatedRoute);
  private readonly _fb = inject(FormBuilder);
  private readonly _router = inject(Router);
  private readonly _cdr = inject(ChangeDetectorRef);
  form: FormGroup;
  isLoading: boolean = false;
  filteredExcursions: AddedExcursionInvoiceDetaill[] = [];
  isLoadingExcursions: boolean = false;
  invoiceId?: number;
  constructor() {
    const now = new Date();
    const defaultEnd = new Date(now.getTime() + 60 * 60 * 1000);
    this.form = this._fb.group({
      name: ['', Validators.required],
      excursionId: [null, Validators.required],
      priceSale: [0],
      priceWithoutTax: [null, Validators.required],
      taxeTypeId: [2],
      amount: [1, [Validators.required, Validators.min(1)]],
      finalPrice: [0],
      startDate: [now, Validators.required],
      startTime: [now, Validators.required],
      endDate: [now, Validators.required],
      endTime: [defaultEnd, Validators.required],
      startDateTime: [null, Validators.required],
      endDateTime: [null, Validators.required]
    });
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
    });
    this.form
      .get('name')
      ?.valueChanges.pipe(
        debounceTime(500),
        switchMap((name: string) => {
          if (!name || name.trim().length < 2) return of({ data: [] });
          return this._excursionsService.getExcursionWithPagination({ name });
        })
      )
      .subscribe((res) => {
        this.filteredExcursions = res.data ?? [];
      });
  }
  ngOnInit(): void {
    const id = this._activateRouter.snapshot.paramMap.get('id');
    if (id) this.invoiceId = Number(id);
    ['amount', 'priceSale', 'priceWithoutTax', 'taxeTypeId'].forEach((field) =>
      this.form
        .get(field)
        ?.valueChanges.subscribe(() => this.updateFinalPrice())
    );
  }
  onExcursionFocus() {
    if (!this.filteredExcursions.length) {
      this._excursionsService
        .getExcursionWithPagination({})
        .subscribe((res) => {
          this.filteredExcursions = res.data ?? [];
        });
    }
  }
  onExcursionSelected(name: string) {
    const exc = this.filteredExcursions.find((e) => e.name === name);
    if (!exc) return;
    this.form.patchValue(
      {
        excursionId: exc.excursionId,
        priceWithoutTax: exc.priceSale,
        priceSale: exc.priceSale
      },
      { emitEvent: true }
    );
    this.updateFinalPrice();
  }
  private getTaxRate(): number {
    const id = this.form.get('taxeTypeId')?.value;
    const tax = this.taxeTypes?.find((t) => t.taxeTypeId === id);
    if (!tax || tax.percentage == null) return 0;
    let rate =
      typeof tax.percentage === 'string'
        ? parseFloat(tax.percentage)
        : tax.percentage;
    if (!isFinite(rate) || rate < 0) return 0;
    if (rate > 1) rate /= 100;
    return rate;
  }
  private updateFinalPrice() {
    const base = Number(this.form.get('priceWithoutTax')?.value ?? 0);
    const amount = Number(this.form.get('amount')?.value ?? 0);
    const taxRate = this.getTaxRate();
    const total = base * (1 + taxRate) * amount;
    this.form.patchValue({ finalPrice: this.round(total, 2) });
  }
  private round(n: number, d = 2): number {
    const p = Math.pow(10, d);
    return Math.round((n + Number.EPSILON) * p) / p;
  }
  private combineDateAndTime(date: Date, time: Date): Date {
    const d = new Date(date);
    const t = new Date(time);
    d.setHours(t.getHours(), t.getMinutes(), 0, 0);
    return d;
  }
  resetForm() {
    const now = new Date();
    const defaultEnd = new Date(now.getTime() + 60 * 60 * 1000);
    this.form.reset({
      taxeTypeId: 2,
      amount: 1,
      finalPrice: 0,
      startDate: now,
      startTime: now,
      endDate: now,
      endTime: defaultEnd,
      startDateTime: null,
      endDateTime: null
    });
    this._router.navigate([], {
      queryParams: {},
      queryParamsHandling: '',
      replaceUrl: true
    });
    this._cdr.detectChanges();
  }
  clearExcursionSelection(): void {
    this.resetForm();
    this.filteredExcursions = [];
  }
  addExcursion(): void {
    if (!this.form.value.excursionId) {
      this.form.get('name')?.setErrors({ required: true });
      this.form.markAllAsTouched();
      return;
    }
    if (!this.invoiceId) {
      console.error('❌ No hay invoiceId definido');
      return;
    }
    if (this.form.valid) {
      const val = this.form.getRawValue();
      const payload: CreateInvoiceDetaill = {
        productId: 0,
        accommodationId: 0,
        excursionId: val.excursionId,
        amount: val.amount,
        priceBuy: 0,
        priceWithoutTax: Number(val.priceWithoutTax),
        taxeTypeId: val.taxeTypeId,
        startDate: new Date(val.startDateTime).toISOString(),
        endDate: new Date(val.endDateTime).toISOString()
      };
      if (!this.saveToBackend) {
        const pendingItem: PendingInvoiceDetail = {
          id: crypto.randomUUID(),
          type: 'Servicio',
          name: val.name,
          payload: payload
        };
        this.pendingItem.emit(pendingItem);
        this.resetForm();
        return;
      }
      this.isLoading = true;
      this._invoiceDetaillService
        .createInvoiceDetaill(this.invoiceId, [payload])
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

