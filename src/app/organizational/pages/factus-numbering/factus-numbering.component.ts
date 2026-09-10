import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BasePageComponent } from '../../../shared/components/base-page/base-page.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import {
  FactusDocumentKind,
  FactusNumberingOverview,
  FactusNumberingRange,
  FactusNumberingService
} from '../../services/factus-numbering.service';

/** Los tres documentos que el sistema emite, en el orden en que se muestran. */
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
    kind: 'supportDocument',
    labelKey: 'organizational.numbering.kind_support',
    icon: 'shopping_cart'
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
  private readonly _snackBar = inject(MatSnackBar);
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
          this.toast('organizational.numbering.refreshed');
        }
      },
      error: (err) => {
        this.loading = false;
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

  /** Rangos que Factus reporta pero que este sistema no emite (nota débito…). */
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
        this.toast('organizational.numbering.saved');
      },
      error: (err) => {
        this.saving = false;
        this.toast(
          err?.error?.message ??
            this._translate.instant('organizational.numbering.save_error'),
          true
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

  private toast(messageOrKey: string, isError = false): void {
    const message = messageOrKey.includes(' ')
      ? messageOrKey
      : this._translate.instant(messageOrKey);
    this._snackBar.open(message, 'OK', {
      duration: isError ? 8000 : 3000,
      panelClass: isError ? ['snack-error'] : undefined
    });
  }
}
