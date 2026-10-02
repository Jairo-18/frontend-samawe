import { Component, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';

import { ButtonLandingComponent } from '../../../shared/components/button-landing/button-landing.component';
import { CustomValidationsService } from '../../../shared/services/customValidations.service';
import { NotificationsService } from '../../../shared/services/notifications.service';
import { LocalStorageService } from '../../../shared/services/localStorage.service';
import { UsersService } from '../../../organizational/services/users.service';
import { AuthService } from '../../../auth/services/auth.service';

/**
 * Cambio de contraseña con la sesión abierta: contraseña actual, nueva y
 * confirmación.
 *
 * Quien no recuerda la actual —o entró siempre con Google y nunca tuvo una— usa
 * "No recuerdo mi contraseña": se le manda el mismo correo de recuperación del
 * login, cuyo enlace abre `auth/:userId/change-password` con su token.
 *
 * Los errores del servidor (contraseña actual incorrecta, demasiados intentos)
 * los muestra el interceptor de notificaciones; aquí solo se maneja el estado
 * del botón.
 */
@Component({
  selector: 'app-change-password-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    ButtonLandingComponent,
    TranslateModule
  ],
  templateUrl: './change-password-form.component.html'
})
export class ChangePasswordFormComponent implements OnDestroy {
  private readonly _fb = inject(FormBuilder);
  private readonly _validations = inject(CustomValidationsService);
  private readonly _usersService = inject(UsersService);
  private readonly _authService = inject(AuthService);
  private readonly _notifications = inject(NotificationsService);
  private readonly _localStorage = inject(LocalStorageService);

  form: FormGroup = this._fb.group(
    {
      oldPassword: ['', Validators.required],
      newPassword: [
        '',
        [Validators.required, this._validations.passwordStrength()]
      ],
      confirmNewPassword: ['', Validators.required]
    },
    {
      validators: this._validations.passwordsMatch(
        'newPassword',
        'confirmNewPassword'
      )
    }
  );

  saving = false;
  sendingReset = false;
  showOld = false;
  showNew = false;
  showConfirm = false;

  /**
   * Al salir sin guardar se vacían los campos. Si siguen con texto cuando la
   * página desaparece, el gestor de contraseñas del navegador lo interpreta
   * como un envío y pregunta "¿actualizar contraseña?" aunque no se haya
   * cambiado nada.
   */
  ngOnDestroy(): void {
    this.form.reset();
  }

  save(): void {
    if (this.form.invalid || this.saving) return;
    this.saving = true;
    this._usersService.changePassword(this.form.value).subscribe({
      next: () => {
        this.saving = false;
        this.form.reset();
      },
      error: () => {
        this.saving = false;
      }
    });
  }

  /** Sin la contraseña actual: correo de recuperación a la cuenta. */
  sendResetEmail(): void {
    if (this.sendingReset) return;
    const userId = this._localStorage.getUserData()?.userId;
    if (!userId) return;
    this.sendingReset = true;

    const done = () => {
      this.sendingReset = false;
      this._notifications.showNotification(
        'success',
        'user.change_password.reset_sent'
      );
    };

    this._usersService.getUserEditPanel(userId).subscribe({
      next: (res) => {
        const email = res.data?.email;
        if (!email) {
          this.sendingReset = false;
          return;
        }
        // Misma respuesta ante cualquier resultado: es lo que hace la pantalla
        // de recuperación, para no revelar nada sobre la cuenta.
        this._authService
          .sendPasswordResetEmail(email)
          .subscribe({ next: done, error: done });
      },
      error: () => {
        this.sendingReset = false;
      }
    });
  }
}
