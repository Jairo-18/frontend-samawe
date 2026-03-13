import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { LocalStorageService } from '../../../shared/services/localStorage.service';
import { LogOutInterface } from '../../../auth/interfaces/logout.interface';
import { UserInterface } from '../../../shared/interfaces/user.interface';

interface SettingsItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, MatIconModule],
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

    console.log('Detected Role Name:', roleName);
    console.log('Detected Role Code:', roleCode);

    if (roleName === 'cliente' || roleCode === 'cliente') {
      this.settingsItems = [
        { label: 'Editar Mi Perfil', icon: 'edit', route: '/profile-edit' }
      ];
    } else if (
      roleName.includes('administrador') ||
      roleCode.includes('administrador')
    ) {
      this.settingsItems = [
        {
          label: 'Ver Mis Recetas',
          icon: 'menu_book',
          route: '/recipes/general'
        },
        {
          label: 'Ver Pedidos de Restaurante',
          icon: 'restaurant',
          route: '/recipes/restaurant-order'
        },
        {
          label: 'Ver Reportes y Ganancias',
          icon: 'attach_money',
          route: '/sales/earnings-sumary'
        },
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
    } else if (
      roleName.includes('recepcionista') ||
      roleCode.includes('recepcionista')
    ) {
      this.settingsItems = [
        {
          label: 'Ver Mis Recetas',
          icon: 'menu_book',
          route: '/recipes/general'
        },
        {
          label: 'Ver Pedidos de Restaurante',
          icon: 'restaurant',
          route: '/recipes/restaurant-order'
        },
        {
          label: 'Ver Reportes y Ganancias',
          icon: 'attach_money',
          route: '/sales/earnings-sumary'
        }
      ];
    } else if (
      roleName.includes('chef') ||
      roleCode.includes('chef') ||
      roleName.includes('mesero') ||
      roleCode.includes('mesero')
    ) {
      this.settingsItems = [
        {
          label: 'Ver Mis Recetas',
          icon: 'menu_book',
          route: '/recipes/general'
        },
        {
          label: 'Ver Pedidos de Restaurante',
          icon: 'restaurant',
          route: '/recipes/restaurant-order'
        }
      ];
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
