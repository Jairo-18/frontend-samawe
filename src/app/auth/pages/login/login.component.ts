import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApplicationService } from '../../../organizational/services/application.service';
import { NotificationsService } from '../../../shared/services/notifications.service';
import { Subscription } from 'rxjs';
import { ButtonLandingComponent } from '../../../shared/components/button-landing/button-landing.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    MatButtonModule,
    RouterLink,
    CommonModule,
    MatIconModule,
    NgOptimizedImage,
    ButtonLandingComponent
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit, OnDestroy {
  private readonly _router: Router = inject(Router);
  private readonly _authService: AuthService = inject(AuthService);
  private readonly _applicationService: ApplicationService =
    inject(ApplicationService);
  private readonly _notificationsService: NotificationsService =
    inject(NotificationsService);

  loginBgUrl: string = '';
  form: FormGroup;
  eyeOpen = faEye;
  eyeClose = faEyeSlash;
  showPassword: boolean = false;
  cooldownRemaining: number = 0;
  loginError: boolean = false;
  private _failedAttempts: number = 0;
  private _cooldownInterval: ReturnType<typeof setInterval> | null = null;
  private _subscription: Subscription = new Subscription();

  constructor(private _fb: FormBuilder) {
    this.form = this._fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadLoginBg();
    this.form.valueChanges.subscribe(() => {
      if (this.cooldownRemaining > 0) {
        clearInterval(this._cooldownInterval!);
        this._cooldownInterval = null;
        this.cooldownRemaining = 0;
      }
      this.loginError = false;
    });
  }

  private loadLoginBg(): void {
    this._subscription.add(
      this._applicationService.mediaMap$.subscribe((mediaMap) => {
        if (mediaMap && mediaMap['LOGIN_BG']) {
          const bg = mediaMap['LOGIN_BG'];
          if (bg && bg.length > 0) {
            this.loginBgUrl = bg[0].url;
          }
        }
      })
    );
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
    if (this._cooldownInterval) clearInterval(this._cooldownInterval);
  }

  private _startCooldown(): void {
    const cooldowns = [30, 60, 120];
    const seconds =
      cooldowns[Math.min(this._failedAttempts - 1, cooldowns.length - 1)];
    this.cooldownRemaining = seconds;
    this._cooldownInterval = setInterval(() => {
      this.cooldownRemaining--;
      if (this.cooldownRemaining <= 0) {
        clearInterval(this._cooldownInterval!);
        this._cooldownInterval = null;
      }
    }, 1000);
  }

  login(): void {
    if (this.form.invalid || this.cooldownRemaining > 0) return;
    this._authService.login(this.form.value).subscribe({
      next: () => {
        this._router.navigateByUrl('/home');
        this._authService.cleanRedirectUrl();
      },
      error: (error) => {
        this.loginError = false;
        const msg: string = error?.error?.message || error?.message || '';
        if (msg.includes('suspendida') || msg.includes('expiró') || msg.includes('verificar')) {
          this._notificationsService.showNotification('error', msg);
        } else {
          this.loginError = true;
          this._failedAttempts++;
          this._startCooldown();
        }
        this._authService.cleanRedirectUrl();
      }
    });
  }

  loginWithGoogle(): void {
    this._authService.loginWithGoogle();
  }
}
