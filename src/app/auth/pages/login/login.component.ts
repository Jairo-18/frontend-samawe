import { Component, inject, OnInit } from '@angular/core';
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
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApplicationService } from '../../../organizational/services/application.service';
import { Subscription } from 'rxjs';
import { OnDestroy } from '@angular/core';

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
    MatIconModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit, OnDestroy {
  private readonly _router: Router = inject(Router);
  private readonly _authService: AuthService = inject(AuthService);
  private readonly _applicationService: ApplicationService =
    inject(ApplicationService);

  loginBgUrl: string = '';
  form: FormGroup;
  eyeOpen = faEye;
  eyeClose = faEyeSlash;
  showPassword: boolean = false;
  private _subscription: Subscription = new Subscription();

  constructor(private _fb: FormBuilder) {
    this.form = this._fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadLoginBg();
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
  }

  login(): void {
    if (this.form.invalid) return;
    this._authService.login(this.form.value).subscribe({
      next: () => {
        this._router.navigateByUrl('/home');
        this._authService.cleanRedirectUrl();
      },
      error: (error) => {
        console.error(error);
      }
    });
  }
}
