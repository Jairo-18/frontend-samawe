import { Component, inject, OnInit } from '@angular/core';
import { SideBarComponent } from '../../components/side-bar/side-bar.component';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { filter, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { LocalStorageService } from '../../../shared/services/localStorage.service';
import { UserInterface } from '../../../shared/interfaces/user.interface';

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
  private _subscription: Subscription = new Subscription();

  isLoggedUser: boolean = false;
  userInfo?: UserInterface;
  isCollapsedSideBar: boolean = true;
  isPhone: boolean = false;
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
}
