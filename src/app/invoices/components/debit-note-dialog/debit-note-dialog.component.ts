import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, debounceTime, filter, forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { ProductsService } from '../../../service-and-product/services/products.service';
import { AccommodationsService } from '../../../service-and-product/services/accommodations.service';
import { ExcursionsService } from '../../../service-and-product/services/excursions.service';
import { TranslatedField } from '../../../shared/types/translated-field.type';
import { BaseDialogComponent } from '../../../shared/components/base-dialog/base-dialog.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { FormatCopPipe } from '../../../shared/pipes/format-cop.pipe';
import { NotificationsService } from '../../../shared/services/notifications.service';
import { InvoiceService } from '../../services/invoice.service';
import {
  CreateDebitNotePayload,
  DebitNote,
  DebitNoteResult
} from '../../interface/debitNote.interface';

/** Una línea editable del formulario. */
interface ChargeRow {
  name: string;
  quantity: number;
  price: number | null;
  taxRate: number;
}

/**
 * Un ítem del catálogo propuesto en el autocompletado (producto, hospedaje o
 * excursión). `price` es el `priceSale`, que en este sistema ya lleva el
 * impuesto dentro — justo lo que espera el campo "Valor unitario".
 */
interface CatalogOption {
  label: string;
  price: number;
  taxRate: number;
}

export interface DebitNoteDialogData {
  invoiceId: number;
  invoiceCode: string;
  factusNumber?: string;
}

/**
 * Nota débito: **suma** valor a una factura electrónica ya emitida.
 *
 * A diferencia del diálogo de nota crédito, aquí no se eligen ítems de la
 * factura. Una nota débito cobra conceptos que no estaban facturados —intereses
 * de mora, gastos de cobranza, un ajuste de valor—, así que las líneas no salen
 * de la factura original.
 *
 * La descripción es un **autocompletado sobre el catálogo** (productos,
 * hospedajes y excursiones) que además **admite texto libre**: si lo que se
 * cobra es una habitación o un producto, elegirlo trae nombre, precio e
 * impuesto ya cuadrados; y si es un concepto que no existe en la base
 * —intereses, un recargo— se escribe y punto.
 */
@Component({
  selector: 'app-debit-note-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BaseDialogComponent,
    LoaderComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatTooltipModule,
    MatAutocompleteModule,
    TranslateModule,
    FormatCopPipe
  ],
  templateUrl: './debit-note-dialog.component.html',
  styleUrls: ['./debit-note-dialog.component.scss']
})
export class DebitNoteDialogComponent implements OnInit {
  private readonly _dialogRef = inject(MatDialogRef<DebitNoteDialogComponent>);
  private readonly _invoiceService = inject(InvoiceService);
  private readonly _notifications = inject(NotificationsService);

  /**
   * Conceptos DIAN de la nota débito. **No hay anulación**: para anular una
   * factura la figura es la nota crédito.
   */
  readonly concepts = [
    { code: '1', labelKey: 'invoice.debit_note.concept_1' },
    { code: '2', labelKey: 'invoice.debit_note.concept_2' },
    { code: '3', labelKey: 'invoice.debit_note.concept_3' },
    { code: '4', labelKey: 'invoice.debit_note.concept_4' }
  ];

  /** Impuestos admitidos, con el mismo criterio que el resto de facturación. */
  readonly taxes = [
    { rate: 0, labelKey: 'invoice.debit_note.tax_none' },
    { rate: 19, labelKey: 'invoice.debit_note.tax_iva_19' },
    { rate: 8, labelKey: 'invoice.debit_note.tax_ipo_8' },
    { rate: 5, labelKey: 'invoice.debit_note.tax_ipo_5' }
  ];

  private readonly _products = inject(ProductsService);
  private readonly _accommodations = inject(AccommodationsService);
  private readonly _excursions = inject(ExcursionsService);
  private readonly _translate = inject(TranslateService);

  loading = true;
  submitting = false;
  conceptCode = '1';
  observation = '';
  rows: ChargeRow[] = [];
  existing: DebitNote[] = [];
  result: DebitNoteResult | null = null;

  /** Sugerencias del catálogo para la fila que se está escribiendo. */
  catalogOptions: CatalogOption[] = [];
  searchingCatalog = false;
  private readonly catalogSearch$ = new Subject<string>();

  constructor(@Inject(MAT_DIALOG_DATA) public data: DebitNoteDialogData) {
    // Ver el comentario de `credit-note-dialog`: ESC y clic fuera tienen que
    // devolver el mismo valor que el botón para que el listado solo recargue
    // cuando de verdad se emitió algo.
    this._dialogRef.disableClose = true;
    this._dialogRef.backdropClick().subscribe(() => this.closeIfIdle());
    this._dialogRef
      .keydownEvents()
      .pipe(filter((event) => event.key === 'Escape'))
      .subscribe(() => this.closeIfIdle());
  }

  private closeIfIdle(): void {
    if (!this.submitting) this.close();
  }

  /**
   * Busca en los tres catálogos a la vez. `catchError` por rama: si un endpoint
   * falla, las otras dos siguen proponiendo — esto es una ayuda para escribir,
   * no una función crítica, y no debe romper la emisión.
   */
  private initCatalogSearch(): void {
    this.catalogSearch$
      .pipe(
        debounceTime(300),
        switchMap((term) => {
          // Sin término se pide el catálogo de arranque (mismo criterio que
          // `onProductFocus` en add-product): al enfocar el campo ya hay
          // sugerencias, en vez de un desplegable vacío hasta que se acierta a
          // escribir. `name: undefined` deja el filtro fuera de la query.
          const name = term.trim() || undefined;
          this.searchingCatalog = true;
          const empty = of({ data: [] as any[] });
          return forkJoin({
            products: this._products
              .getProductWithPagination({ name, excludeCategoryTypeCode: 'ING' })
              .pipe(catchError(() => empty)),
            accommodations: this._accommodations
              .getAccommodationWithPagination({ name })
              .pipe(catchError(() => empty)),
            excursions: this._excursions
              .getExcursionWithPagination({ name })
              .pipe(catchError(() => empty))
          });
        })
      )
      .subscribe((res) => {
        this.searchingCatalog = false;
        this.catalogOptions = [
          ...this.toOptions(res.products?.data),
          ...this.toOptions(res.accommodations?.data),
          ...this.toOptions(res.excursions?.data)
        ].slice(0, 15);
      });
  }

  /** Producto / hospedaje / excursión → opción del autocompletado. */
  private toOptions(items: any[] | undefined): CatalogOption[] {
    return (items ?? [])
      .map((item) => ({
        label: this.translatedName(item?.name),
        price: Number(item?.priceSale ?? 0),
        taxRate: this.resolveTaxRate(item?.taxeType?.percentage)
      }))
      .filter((o) => !!o.label);
  }

  /** El catálogo guarda los nombres como `{ es, en }`. */
  private translatedName(name: TranslatedField | string | undefined): string {
    if (!name) return '';
    if (typeof name === 'string') return name;
    const lang = this._translate.currentLang || this._translate.defaultLang;
    return (
      (name as any)[lang] ??
      (name as any)['es'] ??
      Object.values(name as any)[0] ??
      ''
    );
  }

  /**
   * `percentage` llega unas veces como 19 y otras como 0.19 (mismo criterio que
   * `invoice.service.ts` en el backend). Si el resultado no es una de las tasas
   * que admite la nota débito, se deja "sin impuesto" para no inventarse una
   * tarifa que la DIAN no espera.
   */
  private resolveTaxRate(percentage: unknown): number {
    const raw = Number(percentage ?? 0);
    if (!(raw > 0)) return 0;
    const pct = raw > 1 ? raw : raw * 100;
    const rounded = Math.round(pct);
    return this.taxes.some((t) => t.rate === rounded) ? rounded : 0;
  }

  onNameInput(term: string): void {
    this.catalogSearch$.next(term ?? '');
  }

  /**
   * Al enfocar, propone el catálogo si aún no hay nada cargado. Sin esto el
   * desplegable no aparece hasta escribir, y no había forma de saber que el
   * campo busca en productos, hospedajes y excursiones.
   */
  onNameFocus(row: ChargeRow): void {
    if (!this.catalogOptions.length && !this.searchingCatalog) {
      this.catalogSearch$.next(row.name ?? '');
    }
  }

  /** Al elegir del catálogo se rellena la fila entera, no solo el nombre. */
  onCatalogSelected(row: ChargeRow, option: CatalogOption): void {
    row.name = option.label;
    row.price = option.price > 0 ? option.price : row.price;
    row.taxRate = option.taxRate;
  }

  ngOnInit(): void {
    this.initCatalogSearch();
    this.addRow();
    this._invoiceService.getDebitNotes(this.data.invoiceId).subscribe({
      next: (res) => {
        this.existing = res.data ?? [];
        this.loading = false;
      },
      error: () => {
        // No es bloqueante: el listado previo es informativo, se puede emitir
        // igual. Solo se avisa y se sigue.
        this.loading = false;
        this._notifications.showNotification(
          'error',
          'invoice.debit_note.load_error',
          'invoice.debit_note.title'
        );
      }
    });
  }

  addRow(): void {
    this.rows.push({ name: '', quantity: 1, price: null, taxRate: 0 });
  }

  removeRow(index: number): void {
    this.rows.splice(index, 1);
    if (this.rows.length === 0) this.addRow();
  }

  /**
   * El valor unitario se teclea **con el impuesto incluido**, igual que en el
   * resto del sistema (`invoice.service.ts` guarda `priceSale` como lo que paga
   * el cliente y deriva la base con `priceSale / (1 + tasa)`). Así que el total
   * es cantidad × precio, sin sumar nada encima: 1.000 con IVA 19 % son 1.000,
   * de los cuales 159,66 son impuesto.
   *
   * Antes esto sumaba el impuesto por fuera y mostraba 1.190, que además es lo
   * que se emitía ante la DIAN.
   */
  get total(): number {
    return this.rows.reduce((sum, r) => {
      const qty = Number(r.quantity ?? 0);
      const price = Number(r.price ?? 0);
      if (!(qty > 0) || !(price > 0)) return sum;
      return sum + Math.round(qty * price * 100) / 100;
    }, 0);
  }

  /** Parte del total que es impuesto, para mostrar el desglose. */
  get taxTotal(): number {
    return this.rows.reduce((sum, r) => {
      const qty = Number(r.quantity ?? 0);
      const price = Number(r.price ?? 0);
      const rate = Number(r.taxRate ?? 0);
      if (!(qty > 0) || !(price > 0) || !(rate > 0)) return sum;
      const gross = Math.round(qty * price * 100) / 100;
      const base = Math.round((gross / (1 + rate / 100)) * 100) / 100;
      return sum + Math.round((gross - base) * 100) / 100;
    }, 0);
  }

  /** Base gravable: el total menos el impuesto que lleva dentro. */
  get netTotal(): number {
    return Math.round((this.total - this.taxTotal) * 100) / 100;
  }

  get validRows(): ChargeRow[] {
    return this.rows.filter(
      (r) => r.name?.trim() && Number(r.quantity) > 0 && Number(r.price) > 0
    );
  }

  get canSubmit(): boolean {
    if (this.submitting || this.result || this.loading) return false;
    return this.validRows.length > 0;
  }

  submit(): void {
    if (!this.canSubmit) return;
    this.submitting = true;

    const payload: CreateDebitNotePayload = {
      correctionConceptCode: this.conceptCode,
      observation: this.observation?.trim() || undefined,
      items: this.validRows.map((r) => ({
        name: r.name.trim(),
        quantity: Number(r.quantity),
        price: Number(r.price),
        taxRate: Number(r.taxRate ?? 0),
        // IPOCONSUMO va con código 04; todo lo demás (incluido "sin impuesto")
        // con 01, que es como lo espera Factus.
        taxCode: [8, 5].includes(Number(r.taxRate)) ? '04' : '01'
      }))
    };

    this._invoiceService
      .createDebitNote(this.data.invoiceId, payload)
      .subscribe({
        next: (res) => {
          this.submitting = false;
          this.result = res.data;
          this._notifications.showNotification(
            'success',
            'invoice.debit_note.success_msg',
            'invoice.debit_note.title'
          );
        },
        error: (err) => {
          this.submitting = false;
          const apiErrors = err?.error?.errors;
          const msg =
            Array.isArray(apiErrors) && apiErrors.length
              ? apiErrors.join(' · ')
              : (err?.error?.message ?? 'invoice.debit_note.error_msg');
          this._notifications.showNotification(
            'error',
            msg,
            'invoice.debit_note.title'
          );
        }
      });
  }

  close(): void {
    this._dialogRef.close(!!this.result);
  }
}
