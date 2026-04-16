import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoginSuccessInterface } from '../../interfaces/login.interface';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-google-callback',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './google-callback.component.html',
  styleUrl: './google-callback.component.scss'
})
export class GoogleCallbackComponent implements OnInit {
  private readonly _route: ActivatedRoute = inject(ActivatedRoute);
  private readonly _router: Router = inject(Router);
  private readonly _authService: AuthService = inject(AuthService);

  loading = true;
  error: string | null = null;

  ngOnInit(): void {
    // Data arrives via URL fragment (#) to avoid tokens appearing in server
    // access logs and Referer headers. Parse the fragment manually.
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
      this.error =
        'Error al autenticar con Google. Por favor intenta de nuevo.';
      this.loading = false;
      setTimeout(() => this._router.navigate(['/auth/login']), 2000);
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
      localStorage.setItem('_pendingGoogleProfile', JSON.stringify({
        firstName: params.get('firstName') || '',
        lastName: params.get('lastName') || '',
        email: params.get('email') || '',
      }));
      this._router.navigateByUrl('/complete-profile');
    } else {
      this._router.navigateByUrl('/home');
    }
  }
}
