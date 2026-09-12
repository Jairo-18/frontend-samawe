import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BasePageComponent } from '../../../shared/components/base-page/base-page.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { NotificationsService } from '../../../shared/services/notifications.service';
import {
  FactusDocumentKind,
  FactusNumberingOverview,
  FactusNumberingRange,
  FactusNumberingService
} from '../../services/factus-numbering.service';

/**
 * Los cinco documentos que el sistema emite, agrupados como los piensa el
 * negocio: primero la venta y sus dos notas, luego la compra y la suya.
 */
const KINDS: {
  kind: FactusDocumentKind;
  labelKey: string;
  icon: string;
}[] = [
  {
    kind: 'sales',
    labelKey: 'organizational.numbering.kind_sales',
    icon: 'receipt_long'
  },
  {
    kind: 'creditNote',
    labelKey: 'organizational.numbering.kind_credit_note',
    icon: 'note_alt'
  },
  {
    kind: 'debitNote',
    labelKey: 'organizational.numbering.kind_debit_note',
    icon: 'trending_up'
  },
  {
    kind: 'supportDocument',
    labelKey: 'organizational.numbering.kind_support',
    icon: 'shopping_cart'
  },
  {
    kind: 'adjustmentNote',
    labelKey: 'organizational.numbering.kind_adjustment_note',
    icon: 'tune'
  }
];

/**
 * Numeración DIAN: en qué consecutivo va cada documento y cuánta vigencia le
 * queda a cada resolución. Es la pantalla que le sirve al contador.
 *
 * Los datos del rango son de SOLO LECTURA: el consecutivo lo lleva Factus y
 * copiarlo aquí mostraría un número desactualizado en cuanto alguien emitiera
 * desde su portal. Lo único editable es qué rango usa cada documento.
 */
@Component({
  selector: 'app-factus-numbering',
  standalone: true,
  imports: [
    CommonModule,
    BasePageComponent,
    LoaderComponent,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatTooltipModule,
    TranslateModule
  ],
  templateUrl: './factus-numbering.component.html',
  styleUrls: ['./factus-numbering.component.scss']
})
export class FactusNumberingComponent implements OnInit {
  private readonly _service = inject(FactusNumberingService);
  private readonly _notifications = inject(NotificationsService);
  private readonly _translate = inject(TranslateService);

  readonly kinds = KINDS;

  loading = false;
  saving = false;
  /** Mensaje de error de la carga (p. ej. Factus caído o sin credenciales). */
  loadError: string | null = null;
  overview: FactusNumberingOverview | null = null;

  ngOnInit(): void {
    this.load();
  }

  load(refresh = false): void {
    this.loading = true;
    this.loadError = null;
    const request$ = refresh
      ? this._service.refresh()
      : this._service.getOverview();
    request$.subscribe({
      next: (res) => {
        this.overview = res.data;
        this.loading = false;
        if (refresh) {
          this._notifications.showNotification(
            'success',
            'organizational.numbering.refreshed',
            'organizational.numbering.title'
          );
        }
      },
      error: (err) => {
        this.loading = false;
        // El error de carga se muestra en la propia página (no como toast):
        // suele ser Factus caído o sin rango, y hay que poder leerlo con calma.
        this.loadError =
          err?.error?.message ??
          this._translate.instant('organizational.numbering.load_error');
      }
    });
  }

  /** Rangos que puede usar un documento: los de ese tipo y no vencidos. */
  optionsFor(kind: FactusDocumentKind): FactusNumberingRange[] {
    return (this.overview?.ranges ?? []).filter(
      (r) => r.kind === kind && r.status !== 'expired'
    );
  }

  /** Todos los rangos del tipo, incluidos los vencidos (para la tabla). */
  rangesFor(kind: FactusDocumentKind): FactusNumberingRange[] {
    return (this.overview?.ranges ?? []).filter((r) => r.kind === kind);
  }

  /** Rangos que Factus reporta y que este sistema no emite (nómina, por ejemplo). */
  get otherRanges(): FactusNumberingRange[] {
    return (this.overview?.ranges ?? []).filter((r) => r.kind === null);
  }

  selectionFor(kind: FactusDocumentKind): number | null {
    return this.overview?.selection[kind] ?? null;
  }

  effectiveFor(kind: FactusDocumentKind): number | null {
    return this.overview?.effective[kind] ?? null;
  }

  /**
   * El rango elegido se ignora si el efectivo es otro. Pasa cuando quedó
   * guardado un id de otro entorno —como el 2621 de sandbox que estaba en la
   * base de producción— y conviene que se vea, no que pase desapercibido.
   */
  isSelectionIgnored(kind: FactusDocumentKind): boolean {
    const selected = this.selectionFor(kind);
    return selected !== null && selected !== this.effectiveFor(kind);
  }

  onSelectionChange(kind: FactusDocumentKind, rangeId: number | null): void {
    this.saving = true;
    this._service.updateSelection({ [kind]: rangeId }).subscribe({
      next: (res) => {
        this.overview = res.data;
        this.saving = false;
        this._notifications.showNotification(
          'success',
          'organizational.numbering.saved',
          this._translate.instant(
            this.kinds.find((k) => k.kind === kind)?.labelKey ??
              'organizational.numbering.title'
          )
        );
      },
      error: (err) => {
        this.saving = false;
        this._notifications.showNotification(
          'error',
          // El backend explica POR QUÉ se rechazó (rango de otro documento,
          // vencido, inexistente): ese mensaje vale más que uno genérico.
          err?.error?.message ?? 'organizational.numbering.save_error',
          'organizational.numbering.save_error_title'
        );
        // Se recarga para que el desplegable no quede mostrando algo que no se
        // guardó.
        this.load();
      }
    });
  }

  statusClass(status: FactusNumberingRange['status']): string {
    switch (status) {
      case 'expired':
        return 'bg-red-100 !text-red-700';
      case 'expiring':
        return 'bg-amber-100 !text-amber-700';
      case 'inactive':
        return 'bg-gray-200 !text-gray-700';
      default:
        return 'bg-green-100 !text-green-700';
    }
  }

  statusKey(status: FactusNumberingRange['status']): string {
    return `organizational.numbering.status_${status}`;
  }
}
