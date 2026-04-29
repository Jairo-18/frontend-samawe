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
import { Router, RouterLink } from '@angular/router';
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
  private readonly _authService: AuthService = inject(AuthService);
  private readonly _router: Router = inject(Router);
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

  onResetPassword(): void {
    if (this.resetPasswordForm.invalid || this.cooldownRemaining > 0) return;
    const email = this.resetPasswordForm.get('email')?.value;
    this._authService.sendPasswordResetEmail(email).subscribe({
      next: () => {
        this._startCooldown();
        this._router.navigateByUrl(this._langService.route('auth/login'));
      },
      error: () => {
        this._startCooldown();
      }
    });
  }
}
