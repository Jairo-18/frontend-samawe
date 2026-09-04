import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatCalendarCellClassFunction,
  MatDatepickerModule
} from '@angular/material/datepicker';
import { DateRange } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

import { AccommodationsService } from '../../../service-and-product/services/accommodations.service';
import { AccommodationOccupiedRange } from '../../../service-and-product/interface/accommodation.interface';

export interface SelectedStay {
  startDate: Date;
  endDate: Date;
  nights: number;
  total: number;
}

@Component({
  selector: 'app-availability-calendar',
  standalone: true,
  imports: [CommonModule, MatDatepickerModule, MatIconModule, TranslateModule],
  templateUrl: './availability-calendar.component.html',
  styleUrl: './availability-calendar.component.scss'
})
export class AvailabilityCalendarComponent implements OnChanges {
  private readonly _accommodationsService = inject(AccommodationsService);

  @Input({ required: true }) accommodationId!: number;
  @Input() pricePerNight = 0;
  @Output() stayChange = new EventEmitter<SelectedStay | null>();

  loading = false;
  failed = false;

  startDate: Date | null = null;
  endDate: Date | null = null;

  /** Aviso cuando el rango elegido cruza noches ocupadas. */
  crossedOccupied = false;

  readonly minDate = this._startOfDay(new Date());
  readonly maxDate = (() => {
    const d = this._startOfDay(new Date());
    d.setMonth(d.getMonth() + 12);
    return d;
  })();

  /**
   * Noches ocupadas, como claves `YYYY-MM-DD` en hora local.
   *
   * Se guardan NOCHES, no días: un tramo del 10 al 12 ocupa las noches del 10 y
   * del 11, y el 12 queda libre para que entre el siguiente huésped. Es el
   * mismo criterio semiabierto que usa la validación del backend; si aquí se
   * contara el día de salida, cada cabaña aparecería ocupada una noche de más.
   */
  private _occupiedNights = new Set<string>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['accommodationId'] && this.accommodationId) {
      this._reset();
      this._load();
    }
  }

  private _load(): void {
    this.loading = true;
    this.failed = false;
    this._accommodationsService
      .getAccommodationAvailability(this.accommodationId)
      .subscribe({
        next: (res) => {
          this._occupiedNights = this._buildOccupiedNights(res.data ?? []);
          this.loading = false;
        },
        error: () => {
          // Si falla, el calendario se muestra sin marcar nada en vez de
          // desaparecer: es peor ocultar la disponibilidad que mostrarla
          // incompleta, y el aviso deja claro que hay que confirmar.
          this._occupiedNights = new Set();
          this.failed = true;
          this.loading = false;
        }
      });
  }

  private _buildOccupiedNights(
    ranges: AccommodationOccupiedRange[]
  ): Set<string> {
    const nights = new Set<string>();
    for (const range of ranges) {
      const start = this._startOfDay(new Date(range.startDate));
      const end = this._startOfDay(new Date(range.endDate));
      if (!(start < end)) continue;
      // Tope defensivo: un rango corrupto de años no debe colgar el navegador.
      for (let i = 0, d = new Date(start); d < end && i < 400; i++) {
        nights.add(this._key(d));
        d = this._addDays(d, 1);
      }
    }
    return nights;
  }

  // ── Utilidades de fecha ────────────────────────────────────────────────────
  // Todo en hora LOCAL a propósito. El backend guarda con `toISOString()`, así
  // que leerlo con getters locales devuelve el mismo día que se escribió; con
  // getters UTC se correría una jornada para las horas de tarde/noche.
  private _startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private _addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  private _key(date: Date): string {
    const y = date.getFullYear();
    const m = `${date.getMonth() + 1}`.padStart(2, '0');
    const d = `${date.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private _isOccupied(date: Date): boolean {
    return this._occupiedNights.has(this._key(date));
  }

  /** ¿Alguna noche entre entrada y salida está tomada? */
  private _rangeHasOccupied(start: Date, end: Date): boolean {
    for (let i = 0, d = this._startOfDay(start); d < end && i < 400; i++) {
      if (this._isOccupied(d)) return true;
      d = this._addDays(d, 1);
    }
    return false;
  }

  // ── Enganches del <mat-calendar> ──────────────────────────────────────────
  // Se declaran como propiedades flecha porque Material las invoca sin
  // contexto: con métodos normales, `this` llegaría indefinido.
  readonly dateFilter = (date: Date | null): boolean => {
    if (!date) return false;
    return !this._isOccupied(date);
  };

  readonly dateClass: MatCalendarCellClassFunction<Date> = (date, view) => {
    if (view !== 'month') return '';
    return this._isOccupied(date) ? 'availability-occupied' : '';
  };

  get selectedRange(): DateRange<Date> {
    return new DateRange<Date>(this.startDate, this.endDate);
  }

  onDateSelected(date: Date | null): void {
    if (!date) return;
    this.crossedOccupied = false;

    const picked = this._startOfDay(date);

    // Sin entrada, con estancia ya cerrada, o clic anterior a la entrada:
    // empieza una selección nueva.
    if (!this.startDate || this.endDate || picked <= this.startDate) {
      this.startDate = picked;
      this.endDate = null;
      this._emit();
      return;
    }

    if (this._rangeHasOccupied(this.startDate, picked)) {
      // Hay noches tomadas en medio: en vez de aceptar un rango imposible, se
      // reinicia desde la fecha nueva y se avisa.
      this.crossedOccupied = true;
      this.startDate = picked;
      this.endDate = null;
      this._emit();
      return;
    }

    this.endDate = picked;
    this._emit();
  }

  clear(): void {
    this._reset();
    this._emit();
  }

  private _reset(): void {
    this.startDate = null;
    this.endDate = null;
    this.crossedOccupied = false;
  }

  get nights(): number {
    if (!this.startDate || !this.endDate) return 0;
    const ms = this.endDate.getTime() - this.startDate.getTime();
    return Math.max(0, Math.round(ms / 86400000));
  }

  get total(): number {
    return this.nights * (this.pricePerNight || 0);
  }

  private _emit(): void {
    if (!this.startDate || !this.endDate || this.nights <= 0) {
      this.stayChange.emit(null);
      return;
    }
    this.stayChange.emit({
      startDate: this.startDate,
      endDate: this.endDate,
      nights: this.nights,
      total: this.total
    });
  }
}
