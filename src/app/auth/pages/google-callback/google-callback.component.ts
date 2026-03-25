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
    this._route.queryParams.subscribe((params) => {
      const accessToken = params['accessToken'];
      const refreshToken = params['refreshToken'];
      const userId = params['userId'];
      const roleTypeId = params['roleTypeId'];
      const roleTypeName = params['roleTypeName'];
      const accessSessionId = params['accessSessionId'];
      const organizationalId = params['organizationalId'] || null;
      const avatarUrl = params['avatarUrl'] || null;

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

      if (params['isNewUser'] === 'true') {
        localStorage.setItem('_pendingGoogleProfile', JSON.stringify({
          firstName: params['firstName'] || '',
          lastName: params['lastName'] || '',
          email: params['email'] || '',
        }));
        this._router.navigateByUrl('/complete-profile');
      } else {
        this._router.navigateByUrl('/home');
      }
    });
  }
}
