import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  HostListener,
  PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavItem } from '../../../shared/interfaces/navBar.interface';
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
import { UsersService } from '../../../organizational/services/users.service';
import { LangService } from '../../../shared/services/lang.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [NavbarDesktopComponent, NavbarMobileComponent],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.scss'
})
export class NavBarComponent implements OnInit, OnDestroy {
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _applicationService: ApplicationService =
    inject(ApplicationService);
  private readonly _authService: AuthService = inject(AuthService);
  private readonly _localStorage: LocalStorageService =
    inject(LocalStorageService);
  private readonly _usersService: UsersService = inject(UsersService);
  private readonly _router: Router = inject(Router);
  private readonly _langService: LangService = inject(LangService);
  private readonly _translate: TranslateService = inject(TranslateService);
  private _subscription: Subscription = new Subscription();

  readonly exactOptions = { exact: false };
  readonly exactOptionsStrict = { exact: true };

  isLoggedUser = false;
  isMobileMenuOpen = false;
  navBarItems: NavItem[] = [];
  loginItem: NavItem | undefined;
  organizationalName: string = '';
  logoUrl: string = '';
  isScrolled: boolean = false;
  isScrollingDown: boolean = false;
  isPastHero: boolean = false;
  isHomePage: boolean = false;
  userInfo?: UserInterface;
  loggedMenuItems: NavItem[] = [];
  isBrowser = isPlatformBrowser(this._platformId);
  private _lastScrollY = 0;

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (!isPlatformBrowser(this._platformId)) return;
    const current = window.scrollY;
    this.isScrolled = current > 0;
    this.isScrollingDown = current > this._lastScrollY && current > 80;
    this.isPastHero = current > window.innerHeight;
    this._lastScrollY = current;
  }

  ngOnInit(): void {
    this._buildNavItems();

    this._subscription.add(
      this._translate.onLangChange.subscribe(() => {
        this._buildNavItems();
        this.updateLoggedMenu();
      })
    );

    this.isHomePage = this._isHomePath(this._router.url);
    this._subscription.add(
      this._router.events
        .pipe(filter((e) => e instanceof NavigationEnd))
        .subscribe((e) => {
          this.isHomePage = this._isHomePath(
            (e as NavigationEnd).urlAfterRedirects
          );
          this._buildNavItems();
        })
    );

    this._subscription.add(
      this._applicationService.currentOrg$.subscribe((org) => {
        if (!org) return;
        this.organizationalName = org.name;
        const logo = org.medias?.find((m) => m.mediaType.code === 'LOGO');
        if (logo) this.logoUrl = logo.url;
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

  private _isHomePath(url: string): boolean {
    return url === '/es' || url === '/en' || url === '/es/' || url === '/en/';
  }

  private _buildNavItems(): void {
    const r = (path: string) => this._langService.route(path);
    this.navBarItems = [
      {
        title: this._translate.instant('nav.home'),
        route: r(''),
        icon: 'home',
        exact: true
      },
      {
        title: this._translate.instant('nav.accommodation'),
        route: r('accommodation'),
        icon: 'hotel'
      },
      {
        title: this._translate.instant('nav.gastronomy'),
        route: r('gastronomy'),
        icon: 'restaurant'
      },
      {
        title: this._translate.instant('nav.about_us'),
        route: r('about-us'),
        icon: 'groups'
      },
      {
        title: this._translate.instant('nav.how_to_arrive'),
        route: r('how-to-arrive'),
        icon: 'map'
      },
      {
        title: this._translate.instant('nav.blog'),
        route: r('blog'),
        icon: 'article'
      }
    ];
    this.loginItem = {
      title: this._translate.instant('nav.login'),
      route: r('auth/login'),
      icon: 'login'
    };
  }

  updateLoggedMenu(): void {
    if (this.isLoggedUser) {
      const sessionUser = this._localStorage.getUserData();
      const roleName = sessionUser?.roleType?.name?.toUpperCase() || '';
      const roleCode = sessionUser?.roleType?.code?.toUpperCase() || '';
      const rawItems =
        NAVBAR_LOGGED_CONST[roleName] || NAVBAR_LOGGED_CONST[roleCode] || [];
      this.loggedMenuItems = rawItems.map((item) => ({
        ...item,
        title: item.title ? this._translate.instant(item.title) : item.title,
        route: item.route ? this._langService.route(item.route) : undefined,
        children: item.children
          ? item.children.map((child) => ({
              ...child,
              title: child.title
                ? this._translate.instant(child.title)
                : child.title,
              route: child.route
                ? this._langService.route(child.route)
                : undefined
            }))
          : undefined
      }));

      const userId = sessionUser?.userId;
      if (userId) {
        this._subscription.add(
          this._usersService.getUserEditPanel(userId).subscribe({
            next: (res) => {
              this.userInfo = res.data as unknown as UserInterface;
            }
          })
        );
      }
    } else {
      this.userInfo = undefined;
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
      next: () => this._authService.cleanStorageAndRedirectToLogin(),
      error: () => this._authService.cleanStorageAndRedirectToLogin()
    });
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }
}
