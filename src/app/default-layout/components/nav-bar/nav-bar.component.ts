import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  HostListener
} from '@angular/core';
import { NavItem } from '../../../shared/interfaces/navBar.interface';
import { NAVBAR_CONST } from '../../../shared/constants/navbar.constans';
import { ApplicationService } from '../../../organizational/services/application.service';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../auth/services/auth.service';
import { LocalStorageService } from '../../../shared/services/localStorage.service';
import { LogOutInterface } from '../../../auth/interfaces/logout.interface';
import { NAVBAR_LOGGED_CONST } from '../../../shared/constants/navbar-logged.constants';
import { UserInterface } from '../../../shared/interfaces/user.interface';
import { NavbarDesktopComponent } from '../navbar-desktop/navbar-desktop.component';
import { NavbarMobileComponent } from '../navbar-mobile/navbar-mobile.component';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [NavbarDesktopComponent, NavbarMobileComponent],
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

  readonly exactOptions = { exact: false };
  readonly exactOptionsStrict = { exact: true };

  isLoggedUser: boolean = false;
  isMobileMenuOpen: boolean = false;

  navBarItems: NavItem[] = NAVBAR_CONST.filter(
    (item) => item.route !== '/auth/login'
  );
  loginItem: NavItem | undefined = NAVBAR_CONST.find(
    (item) => item.route === '/auth/login'
  );
  organizationalName: string = '';
  logoUrl: string = '';
  isScrolled: boolean = false;
  isScrollingDown: boolean = false;
  isPastHero: boolean = false;
  isHomePage: boolean = false;
  userInfo?: UserInterface;
  loggedMenuItems: NavItem[] = [];
  private _lastScrollY: number = 0;

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const current = window.scrollY;
    this.isScrolled = current > 0;
    this.isScrollingDown = current > this._lastScrollY && current > 80;
    this.isPastHero = current > window.innerHeight;
    this._lastScrollY = current;
  }

  ngOnInit(): void {
    this.isHomePage = this._router.url === '/home' || this._router.url === '/';
    this._subscription.add(
      this._router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e) => {
        const url = (e as NavigationEnd).urlAfterRedirects;
        this.isHomePage = url === '/home' || url === '/';
      })
    );

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

  openMobileMenu(): void {
    this.isMobileMenuOpen = true;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
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
