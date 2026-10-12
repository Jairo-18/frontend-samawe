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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApplicationService } from '../../../organizational/services/application.service';
import { NotificationsService } from '../../../shared/services/notifications.service';
import { Subscription } from 'rxjs';
import { ButtonLandingComponent } from '../../../shared/components/button-landing/button-landing.component';
import { TranslateModule } from '@ngx-translate/core';
import { LangService } from '../../../shared/services/lang.service';
import {
  ApiConfigService,
  LoginHotel
} from '../../../shared/services/api-config.service';
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
    ButtonLandingComponent,
    TranslateModule
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
  private readonly _langService: LangService = inject(LangService);
  private readonly _route: ActivatedRoute = inject(ActivatedRoute);
  private readonly _apiConfig: ApiConfigService = inject(ApiConfigService);

  /** Rutas legales con el prefijo de idioma activo (`/es/legal/...`). */
  get privacyRoute(): string {
    return this._langService.route('legal/privacity');
  }

  get termsRoute(): string {
    return this._langService.route('legal/terms');
  }

  loginBgUrl: string = '';
  form: FormGroup;
  eyeOpen = faEye;
  eyeClose = faEyeSlash;
  showPassword: boolean = false;
  cooldownRemaining: number = 0;
  loginError: boolean = false;
  /** Otro hotel de la plataforma (`?hotel=<slug>`); `null` = Samawe. */
  hotel: LoginHotel | null = null;

  /**
   * Hay un intento en vuelo.
   *
   * El cooldown de aquí solo arranca **tras un fallo**, así que hasta ahora no
   * había nada que impidiera mandar varios inicios de sesión seguidos mientras
   * el primero seguía en camino: validar credenciales y abrir sesión tarda lo
   * suyo, y sin señal en pantalla lo natural es volver a pulsar.
   */
  loggingIn: boolean = false;
  private _failedAttempts: number = 0;
  private _cooldownInterval: ReturnType<typeof setInterval> | null = null;
  private _subscription: Subscription = new Subscription();

  constructor(private _fb: FormBuilder) {
    this.form = this._fb.group({
      email: [
        '',
        [Validators.required, Validators.email, Validators.pattern(/^\S+$/)]
      ],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    const slug = this._route.snapshot.queryParamMap.get('hotel');
    this.hotel = this._apiConfig.getLoginHotel();
    if (slug) this._selectHotel(slug);
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

  /** Vuelve a la API de Samawe. */
  useDefaultHotel(): void {
    this._apiConfig.setLoginHotel(null);
    this.hotel = null;
  }

  /**
   * `?hotel=<slug>`: se valida contra el backend (que exista y esté activo) y
   * se guarda con su nombre para el aviso. `ecohotelsamawe` o un slug que no
   * existe vuelven al login de Samawe.
   */
  private _selectHotel(slug: string): void {
    const clean = slug.trim().toLowerCase();
    if (!clean || clean === 'ecohotelsamawe') {
      this.useDefaultHotel();
      return;
    }
    this._applicationService.getOrganizationBySlug(clean).subscribe({
      next: (res) => {
        const org = res.data;
        if (!org) return this.useDefaultHotel();
        this.hotel = { slug: org.slug ?? clean, name: org.name };
        this._apiConfig.setLoginHotel(this.hotel);
        this._applicationService.loadBrandingBySlug(this.hotel.slug);
      },
      error: () => this.useDefaultHotel()
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

  onEmailInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.form
      .get('email')
      ?.setValue(input.value.toLowerCase().replace(/\s/g, ''), {
        emitEvent: false
      });
  }

  login(): void {
    if (this.form.invalid || this.cooldownRemaining > 0 || this.loggingIn)
      return;
    this.loggingIn = true;
    this._authService.login(this.form.value).subscribe({
      next: () => {
        this.loggingIn = false;
        this._router.navigateByUrl('/home');
        this._authService.cleanRedirectUrl();
      },
      error: (error) => {
        this.loggingIn = false;
        this.loginError = false;
        const msg: string = error?.error?.message || error?.message || '';
        if (
          msg.includes('suspendida') ||
          msg.includes('expiró') ||
          msg.includes('verificar')
        ) {
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
