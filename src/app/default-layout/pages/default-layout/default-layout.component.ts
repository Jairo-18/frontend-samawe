import { Component, inject, OnInit } from '@angular/core';
import { SideBarComponent } from '../../components/side-bar/side-bar.component';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { filter, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { LocalStorageService } from '../../../shared/services/localStorage.service';
import { UserInterface } from '../../../shared/interfaces/user.interface';
import { LogOutInterface } from '../../../auth/interfaces/logout.interface';
@Component({
  selector: 'app-default-layout',
  standalone: true,
  imports: [SideBarComponent, RouterOutlet, CommonModule],
  templateUrl: './default-layout.component.html',
  styleUrl: './default-layout.component.scss'
})
export class DefaultLayoutComponent implements OnInit {
  private readonly _authService: AuthService = inject(AuthService);
  private readonly _router: Router = inject(Router);
  private readonly _localStorage: LocalStorageService =
    inject(LocalStorageService);
  private _localStorageService: LocalStorageService =
    inject(LocalStorageService);
  private _subscription: Subscription = new Subscription();
  isLoggedUser: boolean = false;
  userInfo?: UserInterface;
  isCollapsedSideBar: boolean = true;
  isPhone: boolean = false;
  user?: UserInterface;
  closeSideBar: boolean = false;
  constructor() {
    this.isPhone = window.innerWidth <= 768;
  }
  ngOnInit(): void {
    this._subscription.add(
      this._authService._isLoggedSubject.subscribe((isLogged) => {
        this.isLoggedUser = isLogged;
        this.userInfo = this._localStorage.getUserData();
      })
    );
    this.isLoggedUser = this._authService.isAuthenticated();
    this._router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.isLoggedUser = this._authService.isAuthenticated();
        this.userInfo = this._localStorage.getUserData();
      });
    this.userInfo = this._localStorage.getUserData();
  }
  listenEvent(event: boolean): void {
    this.isCollapsedSideBar = event;
    this.closeSideBar = false;
  }
  logout(): void {
    if (!this.isLoggedUser) {
      this._router.navigateByUrl('/auth/login');
    } else {
      const allSessionData = this._localStorageService.getAllSessionData();
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

