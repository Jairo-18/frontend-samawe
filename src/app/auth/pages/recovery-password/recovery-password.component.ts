import { NgIf } from '@angular/common';
import { Component, inject, OnDestroy } from '@angular/core';
import {
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormBuilder
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AuthService } from '../../services/auth.service';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { ButtonLandingComponent } from '../../../shared/components/button-landing/button-landing.component';
import { TranslateModule } from '@ngx-translate/core';
import { LangService } from '../../../shared/services/lang.service';

@Component({
  selector: 'app-recovery-password',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgIf,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    RouterLink,
    ButtonLandingComponent,
    TranslateModule
  ],
  templateUrl: './recovery-password.component.html',
  styleUrl: './recovery-password.component.scss'
})
export class RecoveryPasswordComponent implements OnDestroy {
  resetPasswordForm: FormGroup;
  cooldownRemaining: number = 0;

  /**
   * Hay una petición en vuelo.
   *
   * El cooldown solo arranca cuando el backend responde, y hablar con el SMTP
   * tarda uno o dos segundos: en esa ventana el botón seguía activo y sin
   * ninguna señal, así que quien no veía reacción volvía a pulsar. Cada clic
   * mandaba otro correo y, como `generateResetToken` guarda el token en la
   * misma columna del usuario, **cada envío invalidaba el anterior**: llegaban
   * tres correos y solo funcionaba el último. El backend permite justo 3 por
   * minuto (`@Throttle`), que es lo que ponía el techo.
   */
  sending: boolean = false;

  /** Ya se pidió el correo: la tarjeta pasa a la pantalla de confirmación. */
  sent: boolean = false;

  /** Se muestra en la confirmación para que un correo mal escrito se vea. */
  sentTo: string = '';

  private readonly _authService: AuthService = inject(AuthService);
  private readonly _langService = inject(LangService);
  private _cooldownInterval: ReturnType<typeof setInterval> | null = null;

  constructor(private fb: FormBuilder) {
    this.resetPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnDestroy(): void {
    if (this._cooldownInterval) clearInterval(this._cooldownInterval);
  }

  private _startCooldown(seconds: number = 60): void {
    this.cooldownRemaining = seconds;
    this._cooldownInterval = setInterval(() => {
      this.cooldownRemaining--;
      if (this.cooldownRemaining <= 0) {
        clearInterval(this._cooldownInterval!);
        this._cooldownInterval = null;
      }
    }, 1000);
  }

  /** Ruta de login con el prefijo de idioma, para el botón de la confirmación. */
  get loginRoute(): string {
    return this._langService.route('auth/login');
  }

  onResetPassword(): void {
    if (this.resetPasswordForm.invalid || this.cooldownRemaining > 0) return;
    if (this.sending) return;
    this.sending = true;
    const email = this.resetPasswordForm.get('email')?.value;

    // Éxito y error acaban en la MISMA pantalla a propósito: si el "no existe
    // esa cuenta" se distinguiera del "listo, revisa tu correo", esta página
    // serviría para averiguar qué correos están registrados en el hotel.
    // Antes el éxito saltaba a login y el error se quedaba aquí, que es
    // justamente esa diferencia observable.
    const done = (): void => {
      this.sending = false;
      this.sentTo = email;
      this.sent = true;
      this._startCooldown();
    };

    this._authService.sendPasswordResetEmail(email).subscribe({
      next: done,
      error: done
    });
  }
}
