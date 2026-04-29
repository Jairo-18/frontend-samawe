import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoginSuccessInterface } from '../../interfaces/login.interface';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LocalStorageService } from '../../../shared/services/localStorage.service';
import { TranslateModule } from '@ngx-translate/core';
import { LangService } from '../../../shared/services/lang.service';

@Component({
  selector: 'app-google-callback',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, TranslateModule],
  templateUrl: './google-callback.component.html',
  styleUrl: './google-callback.component.scss'
})
export class GoogleCallbackComponent implements OnInit {
  private readonly _router: Router = inject(Router);
  private readonly _authService: AuthService = inject(AuthService);
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _localStorage: LocalStorageService =
    inject(LocalStorageService);
  private readonly _langService = inject(LangService);

  loading: boolean = true;
  error: string | null = null;

  ngOnInit(): void {
    if (!isPlatformBrowser(this._platformId)) return;

    const fragment = window.location.hash.replace(/^#/, '');
    const params = new URLSearchParams(fragment);

    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken') ?? '';
    const userId = params.get('userId');
    const roleTypeId = params.get('roleTypeId') ?? '';
    const roleTypeName = params.get('roleTypeName') ?? '';
    const accessSessionId = params.get('accessSessionId') ?? '';
    const organizationalId = params.get('organizationalId') || null;
    const avatarUrl = params.get('avatarUrl') || null;

    if (!accessToken || !userId) {
      this.error = 'google_callback.error_msg';
      this.loading = false;
      setTimeout(() => this._router.navigateByUrl(this._langService.route('auth/login')), 2000);
      return;
    }

    const sessionData: LoginSuccessInterface = {
      tokens: { accessToken, refreshToken },
      user: {
        userId,
        roleType: { roleTypeId, name: roleTypeName },
        organizationalId: organizationalId || null,
        avatarUrl: avatarUrl || null
      },
      session: { accessSessionId }
    };

    this._authService.saveLocalUserData(sessionData);
    this._authService['_isLoggedSubject'].next(true);

    this.loading = false;

    if (params.get('isNewUser') === 'true') {
      this._localStorage.setItem(
        '_pendingGoogleProfile',
        JSON.stringify({
          firstName: params.get('firstName') || '',
          lastName: params.get('lastName') || '',
          email: params.get('email') || ''
        })
      );
      this._router.navigateByUrl(this._langService.route('complete-profile'));
    } else {
      this._router.navigateByUrl(this._langService.route(''));
    }
  }
}
