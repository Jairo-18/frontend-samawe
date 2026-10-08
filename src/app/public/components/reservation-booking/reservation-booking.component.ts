import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  inject
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { AuthService } from '../../../auth/services/auth.service';
import { InvoiceService } from '../../../invoices/services/invoice.service';
import { CreatedReservation } from '../../../invoices/interface/reservation.interface';
import { LocalStorageService } from '../../../shared/services/localStorage.service';
import { LangService } from '../../../shared/services/lang.service';
import { NotificationsService } from '../../../shared/services/notifications.service';
import { ButtonLandingComponent } from '../../../shared/components/button-landing/button-landing.component';
import { SelectedStay } from '../availability-calendar/availability-calendar.component';

/**
 * Reserva en línea del huésped, bajo el calendario de la ficha.
 *
 * Solo el rol USER puede reservar (el backend lo exige). El personal usa el
 * panel y cualquier otro rol sin permiso no ve el formulario. Sin sesión se
 * invita a entrar. El precio que se muestra es solo informativo: el servidor
 * calcula el real.
 */
@Component({
  selector: 'app-reservation-booking',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatNativeDateModule,
    MatTimepickerModule,
    TranslateModule,
    ButtonLandingComponent
  ],
  templateUrl: './reservation-booking.component.html'
})
export class ReservationBookingComponent implements OnInit, OnDestroy {
  private readonly _authService = inject(AuthService);
  private readonly _invoiceService = inject(InvoiceService);
  private readonly _localStorage = inject(LocalStorageService);
  private readonly _notifications = inject(NotificationsService);
  private readonly _router = inject(Router);
  private readonly _platformId = inject(PLATFORM_ID);
  readonly langService = inject(LangService);

  private readonly _subscription = new Subscription();

  @Input({ required: true }) accommodationId!: number;
  @Input() stay: SelectedStay | null = null;
  /** Aforo máximo del hospedaje (`amountBathroom`). */
  @Input() maxGuests = 0;
  /** Precio por noche base, personas incluidas en él y valor de cada extra. */
  @Input() pricePerNight = 0;
  @Input() includedGuests = 1;
  @Input() extraPersonPrice = 0;
  /** Teléfono del hotel, para mandar el comprobante por WhatsApp. */
  @Input() hotelPhone = '';

  isLogged = false;
  roleCode = '';
  saving = false;
  created: CreatedReservation | null = null;

  readonly form = new FormGroup({
    guests: new FormControl<number>(1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.max(50)]
    }),
    // Hora de entrada habitual del hotel (15:00), como en el formulario del personal.
    arrivalTime: new FormControl<Date | null>(
      (() => {
        const d = new Date();
        d.setHours(15, 0, 0, 0);
        return d;
      })()
    ),
    notes: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.maxLength(300)]
    })
  });

  ngOnInit(): void {
    this._refreshSession();
    this._subscription.add(
      this._authService._isLoggedSubject.subscribe(() => this._refreshSession())
    );
    if (this.maxGuests > 0) {
      this.form.controls.guests.addValidators(Validators.max(this.maxGuests));
    }
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }

  private _refreshSession(): void {
    this.isLogged = this._authService.isAuthenticated();
    this.roleCode = this._localStorage.getUserData()?.roleType?.code ?? '';
  }

  /** Solo el cliente (USER) puede reservar; el personal usa el panel. */
  get canBookOnline(): boolean {
    return this.isLogged && this.roleCode === 'USER';
  }

  /** Huéspedes sobre los incluidos en el precio (lo que se recarga). */
  get extraGuests(): number {
    const guests = Math.floor(Number(this.form.controls.guests.value) || 0);
    return Math.max(0, guests - Math.max(1, this.includedGuests || 1));
  }

  /** Precio por noche con los huéspedes actuales; el servidor recalcula el real. */
  get nightlyRate(): number {
    return this.pricePerNight + this.extraGuests * (this.extraPersonPrice || 0);
  }

  get estimatedTotal(): number {
    return (this.stay?.nights ?? 0) * this.nightlyRate;
  }

  /** Con sesión pero sin poder reservar (personal, proveedor): no se muestra nada. */
  get hidden(): boolean {
    return this.isLogged && !this.canBookOnline;
  }

  goToLogin(): void {
    this._router.navigateByUrl(this.langService.route('auth/login'));
  }

  submit(): void {
    if (!this.stay || this.saving || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { guests, arrivalTime, notes } = this.form.getRawValue();
    this.saving = true;
    this._invoiceService
      .createReservation({
        accommodationId: this.accommodationId,
        startDate: this._ymd(this.stay.startDate),
        endDate: this._ymd(this.stay.endDate),
        guests,
        ...(arrivalTime ? { arrivalTime: this._hhmm(arrivalTime) } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {})
      })
      .subscribe({
        next: (res) => {
          this.saving = false;
          this.created = res.data;
        },
        error: (err) => {
          this.saving = false;
          const apiErrors = err?.error?.message;
          const msg = Array.isArray(apiErrors)
            ? apiErrors.join(' · ')
            : (apiErrors ?? 'public.online_booking.error_generic');
          this._notifications.showNotification(
            'error',
            msg,
            'public.online_booking.title'
          );
        }
      });
  }

  /** `HH:mm` en 24 h, el formato que valida el backend. */
  private _hhmm(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  /** Fecha local `AAAA-MM-DD`; `toISOString()` pasaría a UTC y movería el día. */
  private _ymd(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  get detailRoute(): string {
    // Con el prefijo de idioma, como el resto de enlaces al área del cliente
    // (`my-stays-list`): sin él cae fuera del layout público y sale vacío.
    return this.created
      ? this.langService.route(`user/invoices/${this.created.invoiceId}`)
      : '';
  }

  /** Aviso por WhatsApp para mandar el comprobante de pago. */
  openWhatsapp(): void {
    if (!this.created || !isPlatformBrowser(this._platformId)) return;
    const phone = this.hotelPhone.replace(/\D/g, '');
    if (!phone) return;
    const text = `Hola, hice la reserva ${this.created.code} y quiero enviar el comprobante de pago.`;
    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(text)}`,
      '_blank'
    );
  }

  reset(): void {
    this.created = null;
  }
}
