import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { UserInterface } from '../../../shared/interfaces/user.interface';
import { LocalStorageService } from '../../../shared/services/localStorage.service';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  isLoggedUser: boolean = false;
  userInfo?: UserInterface;
  private readonly _subscription: Subscription = new Subscription();

  private readonly _authService: AuthService = inject(AuthService);
  private readonly _localStorage: LocalStorageService =
    inject(LocalStorageService);
  private readonly _router: Router = inject(Router);

  ngOnInit(): void {
    // Verificamos el estado de si está logueado o no
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
}
