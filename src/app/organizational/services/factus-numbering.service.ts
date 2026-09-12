import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Familias de documento que el sistema emite. */
export type FactusDocumentKind =
  | 'sales'
  | 'creditNote'
  | 'debitNote'
  | 'supportDocument'
  | 'adjustmentNote';

export interface FactusNumberingRange {
  id: number;
  kind: FactusDocumentKind | null;
  documentName: string;
  prefix: string;
  /**
   * Límites del rango. Son `null` en las notas crédito: la DIAN no expide
   * resolución para ellas, así que el rango no tiene desde/hasta ni vigencia.
   * La vista los muestra como «N/A», igual que el portal de Factus.
   */
  from: number | null;
  to: number | null;
  /** Siguiente número que se emitirá (NO el último emitido). */
  current: number;
  /** Números sin usar; `null` cuando el rango no tiene tope. */
  remaining: number | null;
  resolutionNumber: string | null;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  isExpired: boolean;
  daysToExpire: number | null;
  status: 'ok' | 'expiring' | 'expired' | 'inactive';
}

export type FactusRangeSelection = Record<FactusDocumentKind, number | null>;

export interface FactusNumberingOverview {
  ranges: FactusNumberingRange[];
  /** Lo que hay guardado; `null` significa "automático". */
  selection: FactusRangeSelection;
  /** Lo que se usaría ahora mismo, tras aplicar el auto-resuelto. */
  effective: FactusRangeSelection;
}

/**
 * Numeración DIAN. Los datos de cada rango se leen en vivo de Factus, que es la
 * fuente de verdad del consecutivo; lo único que se guarda en la base es qué
 * rango usa cada documento.
 */
@Injectable({ providedIn: 'root' })
export class FactusNumberingService {
  private readonly _http = inject(HttpClient);
  private readonly _base = `${environment.apiUrl}factus/numbering-ranges`;

  getOverview(): Observable<{ data: FactusNumberingOverview }> {
    return this._http.get<{ data: FactusNumberingOverview }>(this._base);
  }

  /** Relee de Factus saltándose el cache de 10 minutos del backend. */
  refresh(): Observable<{ data: FactusNumberingOverview }> {
    return this._http.post<{ data: FactusNumberingOverview }>(
      `${this._base}/refresh`,
      {}
    );
  }

  /** Fija el rango de uno o varios documentos. `null` vuelve a automático. */
  updateSelection(
    changes: Partial<Record<FactusDocumentKind, number | null>>
  ): Observable<{ data: FactusNumberingOverview }> {
    return this._http.patch<{ data: FactusNumberingOverview }>(
      `${this._base}/selection`,
      changes
    );
  }
}
