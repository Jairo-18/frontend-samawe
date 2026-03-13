import { Component, inject, OnInit, OnDestroy, HostListener } from '@angular/core';
import { SideBarComponent } from '../../components/side-bar/side-bar.component';
import { NavBarComponent } from '../../components/nav-bar/nav-bar.component';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { filter, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { LocalStorageService } from '../../../shared/services/localStorage.service';
import { UserInterface } from '../../../shared/interfaces/user.interface';
import { LogOutInterface } from '../../../auth/interfaces/logout.interface';
import { NotificationButtonComponent } from '../../components/notification-button/notification-button.component';
import { MobileMenuComponent } from '../../components/mobile-menu/mobile-menu.component';
import { RelatedDataService } from '../../../shared/services/relatedData.service';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
@Component({
  selector: 'app-default-layout',
  standalone: true,
  imports: [
    SideBarComponent,
    NavBarComponent,
    RouterOutlet,
    CommonModule,
    NotificationButtonComponent,
    MobileMenuComponent,
    LoaderComponent
  ],
  templateUrl: './default-layout.component.html',
  styleUrl: './default-layout.component.scss'
})
export class DefaultLayoutComponent implements OnInit, OnDestroy {
  private readonly _authService: AuthService = inject(AuthService);
  private readonly _router: Router = inject(Router);
  private readonly _localStorage: LocalStorageService =
    inject(LocalStorageService);
  public readonly _relatedDataService: RelatedDataService =
    inject(RelatedDataService);
  private _subscription: Subscription = new Subscription();
  isLoggedUser: boolean = false;
  userInfo?: UserInterface;
  isCollapsedSideBar: boolean = true;
  isPhone: boolean = false;
  user?: UserInterface;
  closeSideBar: boolean = false;
  showNotificationsIcon: boolean = false;
  showNavBar: boolean = false;
  showSideBar: boolean = false;

  constructor() {
    this.isPhone = window.innerWidth <= 768;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: UIEvent) {
    const window = event.target as Window;
    this.isPhone = window.innerWidth <= 768;
    this.checkSideBarVisibility();
    this.checkRolesForNavBar();
  }
  ngOnInit(): void {
    this._subscription.add(
      this._authService._isLoggedSubject.subscribe((isLogged) => {
        this.isLoggedUser = isLogged;
        this.userInfo = this._localStorage.getUserData();
        this.checkRolesForNotifications();
        this.checkRolesForNavBar();
        this.checkSideBarVisibility();
      })
    );
    this.isLoggedUser = this._authService.isAuthenticated();
    this.userInfo = this._localStorage.getUserData();
    this.checkRolesForNotifications();
    this.checkRolesForNavBar();
    this.checkSideBarVisibility();

    this._router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.isLoggedUser = this._authService.isAuthenticated();
        this.userInfo = this._localStorage.getUserData();
        this.checkRolesForNotifications();
        this.checkRolesForNavBar();
        this.checkSideBarVisibility();
      });
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }

  private checkRolesForNotifications() {
    if (!this.userInfo?.roleType?.name) {
      this.showNotificationsIcon = false;
      return;
    }

    const roleName = this.userInfo.roleType.name.toUpperCase();
    this.showNotificationsIcon = [
      'ADMINISTRADOR',
      'MESERO',
      'CHEF',
      'RECEPCIONISTA'
    ].includes(roleName);
  }

  private checkRolesForNavBar() {
    if (this.isPhone) {
      this.showNavBar = !this.isLoggedUser;
      return;
    }

    if (!this.userInfo?.roleType?.name) {
      this.showNavBar = true;
      return;
    }

    const roleName = this.userInfo.roleType.name.toUpperCase();
    this.showNavBar = roleName === 'CLIENTE';
  }

  private checkSideBarVisibility() {
    this.showSideBar = !!(
      this.isLoggedUser &&
      !this.isPhone &&
      (this.userInfo?.roleType?.name === 'Administrador' ||
        this.userInfo?.roleType?.name === 'ADMINISTRADOR' ||
        this.userInfo?.roleType?.name === 'Recepcionista' ||
        this.userInfo?.roleType?.name === 'RECEPCIONISTA' ||
        this.userInfo?.roleType?.name === 'MESERO' ||
        this.userInfo?.roleType?.name === 'CHEF')
    );
  }

  listenEvent(event: boolean): void {
    this.isCollapsedSideBar = event;
    this.closeSideBar = false;
  }
  logout(): void {
    if (!this.isLoggedUser) {
      this._router.navigateByUrl('/auth/login');
    } else {
      const allSessionData = this._localStorage.getAllSessionData();
      if (
        !allSessionData?.user?.userId ||
        !allSessionData?.tokens?.accessToken ||
        !allSessionData?.session?.accessSessionId
      ) {
        console.error('Faltan datos de sesión para cerrar sesión');
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
          this.user = undefined;
        },
        error: () => {
          this._authService.cleanStorageAndRedirectToLogin();
        }
      });
    }
  }
}
