import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { LocalStorageService } from '../../../shared/services/localStorage.service';
import { LogOutInterface } from '../../../auth/interfaces/logout.interface';
import { UserInterface } from '../../../shared/interfaces/user.interface';
import { BasePageComponent } from '../../../shared/components/base-page/base-page.component';

interface SettingsItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, MatIconModule, BasePageComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  private readonly _authService: AuthService = inject(AuthService);
  private readonly _router: Router = inject(Router);
  private readonly _localStorage: LocalStorageService =
    inject(LocalStorageService);

  userInfo?: UserInterface;
  settingsItems: SettingsItem[] = [];

  ngOnInit(): void {
    this.userInfo = this._localStorage.getUserData();
    this.generateSettingsItems();
  }

  private generateSettingsItems(): void {
    const roleName = this.userInfo?.roleType?.name?.toLowerCase().trim() || '';
    const roleCode = this.userInfo?.roleType?.code?.toLowerCase().trim() || '';

    const profileItems: SettingsItem[] = [
      { label: 'Ver Perfil', icon: 'person', route: '/user/profile' },
      {
        label: 'Cambiar Contraseña',
        icon: 'lock',
        route: `/auth/${this.userInfo?.userId}/change-password`
      }
    ];

    if (
      roleName.includes('administrador') ||
      roleCode.includes('administrador')
    ) {
      this.settingsItems = [
        ...profileItems,
        {
          label: 'Gestión',
          icon: 'category',
          route: '/organizational/types/manage'
        },
        {
          label: 'Aplicación',
          icon: 'settings_applications',
          route: '/organizational/application'
        }
      ];
    } else {
      this.settingsItems = profileItems;
    }
  }

  navigateTo(route: string): void {
    this._router.navigate([route]);
  }

  logout(): void {
    const allSessionData = this._localStorage.getAllSessionData();
    if (
      !allSessionData?.user?.userId ||
      !allSessionData?.tokens?.accessToken ||
      !allSessionData?.session?.accessSessionId
    ) {
      this._authService.cleanStorageAndRedirectToLogin();
      return;
    }

    const sessionDataToLogout: LogOutInterface = {
      userId: allSessionData.user.userId,
      accessToken: allSessionData.tokens.accessToken,
      accessSessionId: allSessionData.session.accessSessionId
    };

    this._authService.logout(sessionDataToLogout).subscribe({
      next: () => {
        this._authService.cleanStorageAndRedirectToLogin();
      },
      error: () => {
        this._authService.cleanStorageAndRedirectToLogin();
      }
    });
  }
}
