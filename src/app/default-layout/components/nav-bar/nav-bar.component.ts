import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  HostListener
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NavItem } from '../../../shared/interfaces/navBar.interface';
import { NAVBAR_CONST } from '../../../shared/constants/navbar.constans';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { ApplicationService } from '../../../organizational/services/application.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../auth/services/auth.service';
import { LocalStorageService } from '../../../shared/services/localStorage.service';
import { LogOutInterface } from '../../../auth/interfaces/logout.interface';
import { NAVBAR_LOGGED_CONST } from '../../../shared/constants/navbar-logged.constants';
import { UserInterface } from '../../../shared/interfaces/user.interface';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [
    RouterLink,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    CommonModule
  ],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.scss'
})
export class NavBarComponent implements OnInit, OnDestroy {
  private readonly _applicationService: ApplicationService =
    inject(ApplicationService);
  private readonly _authService: AuthService = inject(AuthService);
  private readonly _localStorage: LocalStorageService =
    inject(LocalStorageService);
  private readonly _router: Router = inject(Router);
  private _subscription: Subscription = new Subscription();

  isLoggedUser: boolean = false;

  navBarItems: NavItem[] = NAVBAR_CONST.filter(
    (item) => item.route !== '/auth/login'
  );
  loginItem: NavItem | undefined = NAVBAR_CONST.find(
    (item) => item.route === '/auth/login'
  );
  organizationalName: string = '';
  logoUrl: string = '';
  isScrolled: boolean = false;
  userInfo?: UserInterface;
  loggedMenuItems: NavItem[] = [];

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 0;
  }

  ngOnInit(): void {
    this._subscription.add(
      this._applicationService.currentOrg$.subscribe((organizational) => {
        if (organizational) {
          this.organizationalName = organizational.name;
          if (organizational.medias) {
            const logo = organizational.medias.find(
              (m) => m.mediaType.code === 'LOGO'
            );
            if (logo) {
              this.logoUrl = logo.url;
            }
          }
        }
      })
    );

    this._subscription.add(
      this._authService._isLoggedSubject.subscribe((isLogged) => {
        this.isLoggedUser = isLogged;
        this.updateLoggedMenu();
      })
    );
    this.isLoggedUser = this._authService.isAuthenticated();
    this.updateLoggedMenu();
  }

  updateLoggedMenu(): void {
    if (this.isLoggedUser) {
      this.userInfo = this._localStorage.getUserData();
      const roleName = this.userInfo?.roleType?.name?.toUpperCase() || '';
      const roleCode = this.userInfo?.roleType?.code?.toUpperCase() || '';

      this.loggedMenuItems =
        NAVBAR_LOGGED_CONST[roleName] || NAVBAR_LOGGED_CONST[roleCode] || [];
    } else {
      this.loggedMenuItems = [];
    }
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

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }
}
