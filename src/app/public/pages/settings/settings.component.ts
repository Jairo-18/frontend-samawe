import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { LocalStorageService } from '../../../shared/services/localStorage.service';
import { LogOutInterface } from '../../../auth/interfaces/logout.interface';
import { UserInterface } from '../../../shared/interfaces/user.interface';
import { BasePageComponent } from '../../../shared/components/base-page/base-page.component';
import { LangService } from '../../../shared/services/lang.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

interface SettingsItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, MatIconModule, BasePageComponent, TranslateModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  private readonly _authService: AuthService = inject(AuthService);
  private readonly _router: Router = inject(Router);
  private readonly _localStorage: LocalStorageService =
    inject(LocalStorageService);
  private readonly _langService: LangService = inject(LangService);
  private readonly _translate: TranslateService = inject(TranslateService);

  userInfo?: UserInterface;
  settingsItems: SettingsItem[] = [];

  ngOnInit(): void {
    this.userInfo = this._localStorage.getUserData();
    this.generateSettingsItems();
  }

  private generateSettingsItems(): void {
    const roleCode = this.userInfo?.roleType?.code?.toUpperCase() || '';

    const profileItems: SettingsItem[] = [
      {
        label: this._translate.instant('auth.profile'),
        icon: 'person',
        route: 'user/profile'
      }
    ];

    if (roleCode === 'ADMIN' || roleCode === 'SUPERADMIN') {
      this.settingsItems = [
        ...profileItems,
        {
          label: this._translate.instant('sidebar.management'),
          icon: 'category',
          route: 'organizational/types/manage'
        },
        {
          label: this._translate.instant('sidebar.application'),
          icon: 'settings_applications',
          route: 'organizational/application'
        }
      ];
    } else {
      this.settingsItems = profileItems;
    }
  }

  navigateTo(route: string): void {
    this._router.navigate([this._langService.route(route)]);
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
