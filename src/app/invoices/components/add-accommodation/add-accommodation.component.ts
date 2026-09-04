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
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NotificationsService } from '../../../shared/services/notifications.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatedPipe } from '../../../shared/pipes/translated.pipe';
import { FormatCopPipe } from '../../../shared/pipes/format-cop.pipe';
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
    CurrencyFormatDirective,
    TranslateModule,
    MatTooltipModule,
    TranslatedPipe,
    FormatCopPipe
  ],
  templateUrl: './add-accommodation.component.html',
  styleUrl: './add-accommodation.component.scss'
})
export class AddAccommodationComponent implements OnInit {
  @Input() categoryTypes: CategoryType[] = [];
  @Input() taxeTypes: TaxeType[] = [];
  @Input() additionalTypes: AdditionalType[] = [];
  @Input() discountTypes: DiscountType[] = [];
  @Input() saveToBackend: boolean = true;
  /**
   * Ítems ya añadidos a esta factura y todavía sin guardar. El backend no puede
   * validarlos porque aún no existen en base de datos, así que el choque de dos
   * líneas de la misma factura sobre la misma cabaña se comprueba aquí.
   */
  @Input() pendingItems: PendingInvoiceDetail[] = [];
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
  private readonly _notificationsService: NotificationsService =
    inject(NotificationsService);
  private readonly _translateService: TranslateService =
    inject(TranslateService);
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
  private isCalculating = false;
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
    });
    ['amount', 'taxeTypeId', 'discountTypeId', 'additionalTypeId'].forEach(
      (field) => {
        this.form.get(field)?.valueChanges.subscribe(() => {
          if (!this.isCalculating) this.calculateFinalPrice();
        });
      }
    );
  }
  /** Horas de hotel por defecto: entrada 15:00, salida 12:00. */
  private static readonly CHECK_IN_HOUR = 15;
  private static readonly CHECK_OUT_HOUR = 12;

  /** No se permite elegir fechas pasadas en el calendario. */
  readonly today: Date = AddAccommodationComponent.atHour(new Date(), 0);

  /** Salida siempre posterior a la entrada; el datepicker lo impide. */
  get minEndDate(): Date {
    const start = this.form?.get('startDate')?.value;
    return start ? new Date(start) : this.today;
  }

  private static atHour(date: Date, hour: number): Date {
    const d = new Date(date);
    d.setHours(hour, 0, 0, 0);
    return d;
  }

  private static addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  constructor() {
    // Antes el valor por defecto era "ahora" y "ahora + 5 minutos": si el
    // recepcionista cambiaba las fechas pero no las horas, la estancia se
    // quedaba con la hora a la que estaba escribiendo. Como `startDate` y
    // `endDate` son `timestamp` en la BD, esa hora entra en el cálculo de
    // solape y dos reservas del mismo día podían no detectarse como choque.
    const startDefault = AddAccommodationComponent.atHour(
      new Date(),
      AddAccommodationComponent.CHECK_IN_HOUR
    );
    const endDefault = AddAccommodationComponent.atHour(
      AddAccommodationComponent.addDays(new Date(), 1),
      AddAccommodationComponent.CHECK_OUT_HOUR
    );
    this.form = this._fb.group({
      name: ['', Validators.required],
      accommodationId: [null, Validators.required],
      priceSale: [0],
      priceWithoutTax: [null],
      taxeTypeId: [2],
      amount: [1, [Validators.required, Validators.min(1)]],
      amountPerson: [0],
      amountBathroom: [0],
      startDate: [startDefault, Validators.required],
      startTime: [startDefault, Validators.required],
      endDate: [endDefault, Validators.required],
      endTime: [endDefault, Validators.required],
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
            name,
            ...this.availabilityRange()
          });
        })
      )
      .subscribe((res) => {
        this.filteredAccommodations = res.data ?? [];
      });

    // Al cambiar cualquiera de las cuatro fechas cambia la disponibilidad: se
    // refresca la lista y, si el que estaba elegido ya no está libre, se quita
    // la selección en vez de dejar que llegue al backend y falle al guardar.
    ['startDate', 'startTime', 'endDate', 'endTime'].forEach((field) => {
      this.form
        .get(field)
        ?.valueChanges.pipe(debounceTime(300))
        .subscribe(() => this.onDateRangeChanged());
    });
  }

  /**
   * Rango en el formato que espera el backend, o `{}` si aún no está completo
   * o es incoherente (fin anterior o igual al inicio). Devolver `{}` desactiva
   * el filtro de disponibilidad en lugar de mandar un rango inválido.
   */
  private availabilityRange(): { startDate?: string; endDate?: string } {
    const v = this.form?.getRawValue();
    if (!v?.startDate || !v?.startTime || !v?.endDate || !v?.endTime) return {};
    const start = this.combineDateAndTime(v.startDate, v.startTime);
    const end = this.combineDateAndTime(v.endDate, v.endTime);
    if (!(start < end)) return {};
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  }

  private onDateRangeChanged(): void {
    const range = this.availabilityRange();
    const selectedId = this.form.get('accommodationId')?.value;

    this._accommodationsService
      .getAccommodationWithPagination({ ...range, perPage: 200 })
      .subscribe((res) => {
        const available = res.data ?? [];
        if (
          selectedId &&
          Object.keys(range).length > 0 &&
          !available.some((a) => a.accommodationId === selectedId)
        ) {
          this.form.patchValue(
            { name: '', accommodationId: null },
            { emitEvent: false }
          );
          this.form.get('name')?.setErrors({ unavailable: true });
        }
        this._cdr.detectChanges();
      });
  }

  /**
   * Choque contra las líneas de esta misma factura todavía sin guardar. El
   * backend no las ve porque aún no existen. Mismo criterio de solape que en
   * servidor: intervalos semiabiertos, el día de salida queda libre.
   */
  private overlapsPendingItems(
    accommodationId: number,
    start: string,
    end: string
  ): boolean {
    return this.pendingItems.some((item) => {
      const p = item.payload;
      if (!p || p.accommodationId !== accommodationId) return false;
      if (!p.startDate || !p.endDate) return false;
      return p.startDate < end && p.endDate > start;
    });
  }
  displayAccommodation(acc?: AddedAccommodationInvoiceDetaill): string {
    if (!acc) return '';
    const n = acc.name;
    return typeof n === 'string' ? n : (n['es'] ?? Object.values(n)[0] ?? '');
  }
  resetForm() {
    // Se conservan las fechas ya elegidas: al añadir varias cabañas para la
    // misma estancia, volver a "hoy" obligaba a reescribirlas en cada línea.
    const startDefault =
      this.form?.get('startDate')?.value ??
      AddAccommodationComponent.atHour(
        new Date(),
        AddAccommodationComponent.CHECK_IN_HOUR
      );
    const endDefault =
      this.form?.get('endDate')?.value ??
      AddAccommodationComponent.atHour(
        AddAccommodationComponent.addDays(new Date(), 1),
        AddAccommodationComponent.CHECK_OUT_HOUR
      );
    const startTime =
      this.form?.get('startTime')?.value ?? startDefault;
    const endTime = this.form?.get('endTime')?.value ?? endDefault;
    this.form.reset(
      {
        name: '',
        accommodationId: null,
        taxeTypeId: 2,
        amount: 1,
        priceWithoutTax: 0,
        startDate: startDefault,
        startTime: startTime,
        endDate: endDefault,
        endTime: endTime,
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
    Object.keys(this.form.controls).forEach((key) => {
      this.form.get(key)?.setErrors(null);
    });
    this._router.navigate([], {
      queryParams: {},
      queryParamsHandling: '',
      replaceUrl: true
    });
    this._cdr.detectChanges();
  }
  private parseNumber(val: string | number | null | undefined): number {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (typeof val === 'string') {
      const str = val.trim();
      if (str === '') return 0;

      if (str.includes(',') && str.includes('.')) {
        const clean = str.replace(/\./g, '').replace(',', '.');
        const num = parseFloat(clean);
        return isNaN(num) ? 0 : num;
      }

      if (str.includes(',') && !str.includes('.')) {
        const clean = str.replace(',', '.');
        const num = parseFloat(clean);
        return isNaN(num) ? 0 : num;
      }
      if (str.includes('.')) {
        const parts = str.split('.');
        const lastPart = parts[parts.length - 1];

        if (lastPart.length <= 2) {
          const num = parseFloat(str);
          return isNaN(num) ? 0 : num;
        }

        if (lastPart.length === 3) {
          const clean = str.replace(/\./g, '');
          const num = parseFloat(clean);
          return isNaN(num) ? 0 : num;
        }
      }

      const num = parseFloat(str);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  }
  calculateFinalPrice() {
    const formValue = this.form.getRawValue();
    let basePrice = this.parseNumber(this.originalPrice);
    if (formValue.discountTypeId) {
      const discount = this.discountTypes.find(
        (d) => d.discountTypeId === formValue.discountTypeId
      );
      if (discount && discount.code) {
        basePrice = basePrice - this.parseNumber(discount.code);
      }
    }
    if (formValue.additionalTypeId) {
      const additional = this.additionalTypes.find(
        (a) => a.additionalTypeId === formValue.additionalTypeId
      );
      if (additional) {
        basePrice = basePrice + this.parseNumber(additional.value);
      }
    }
    this.subtotal = basePrice;
    const selectedTax = this.taxeTypes.find(
      (t) => t.taxeTypeId === formValue.taxeTypeId
    );
    let taxPercent = 0;
    if (selectedTax && selectedTax.percentage) {
      let rate = this.parseNumber(selectedTax.percentage);
      if (rate > 1) rate = rate / 100;
      taxPercent = rate;
    }

    this.unitPrice = this.subtotal;
    this.taxAmount =
      taxPercent > 0
        ? Math.round((this.subtotal - this.subtotal / (1 + taxPercent)) * 100) /
          100
        : 0;
    let amount = this.parseNumber(formValue.amount);
    if (amount <= 0) amount = 1;

    const round2 = (num: number) =>
      Math.round((num + Number.EPSILON) * 100) / 100;
    this.finalPrice = round2(this.unitPrice * amount);
    this.isCalculating = true;
    this.form.patchValue({
      priceWithoutTax: round2(this.subtotal),
      unitPrice: round2(this.unitPrice),
      finalPrice: this.finalPrice
    });
    this.isCalculating = false;
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
        .getAccommodationWithPagination({ ...this.availabilityRange() })
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
      priceSale: price,
      ...(acc.taxeType?.taxeTypeId != null && {
        taxeTypeId: acc.taxeType.taxeTypeId
      })
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
      this.form.get('name')?.markAsDirty();
      this.form.markAllAsTouched();
      this._cdr.detectChanges();
      return;
    }
    if (this.form.valid) {
      const formValue = this.form.getRawValue();

      // La salida tiene que ser posterior a la entrada. Sin esto se podía
      // guardar un rango invertido, que además nunca solapa con nada y se
      // saltaba en la práctica el control de doble reserva.
      const range = this.availabilityRange();
      if (!range.startDate || !range.endDate) {
        this._notificationsService.showNotification(
          'error',
          this._translateService.instant(
            'invoice.common.accommodation_invalid_range'
          )
        );
        return;
      }

      if (
        this.overlapsPendingItems(
          formValue.accommodationId,
          range.startDate,
          range.endDate
        )
      ) {
        this._notificationsService.showNotification(
          'error',
          this._translateService.instant(
            'invoice.common.accommodation_already_in_invoice'
          )
        );
        return;
      }

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
        priceSale: Number(priceToSend),
        taxeTypeId: formValue.taxeTypeId,
        startDate: range.startDate,
        endDate: range.endDate
      };
      if (!this.saveToBackend) {
        const pendingItem: PendingInvoiceDetail = {
          id: crypto.randomUUID(),
          type: 'Hospedaje',
          name: (formValue.name?.name?.['es'] ?? String(formValue.name?.name ?? '')) || 'Hospedaje',
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
