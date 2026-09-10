import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Familias de documento que el sistema emite. */
export type FactusDocumentKind = 'sales' | 'creditNote' | 'supportDocument';

export interface FactusNumberingRange {
  id: number;
  kind: FactusDocumentKind | null;
  documentName: string;
  prefix: string;
  from: number;
  to: number;
  /** Siguiente número que se emitirá (NO el último emitido). */
  current: number;
  remaining: number;
  resolutionNumber: string | null;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  isExpired: boolean;
  daysToExpire: number | null;
  status: 'ok' | 'expiring' | 'expired' | 'inactive';
}

export interface FactusRangeSelection {
  sales: number | null;
  creditNote: number | null;
  supportDocument: number | null;
}

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
