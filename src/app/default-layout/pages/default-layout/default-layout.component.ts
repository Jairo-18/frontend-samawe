import { Component, inject, OnInit } from '@angular/core';
import { SideBarComponent } from '../../components/side-bar/side-bar.component';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { User } from '../../../auth/interfaces/login.interface';
import { filter, finalize } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-default-layout',
  standalone: true,
  imports: [SideBarComponent, RouterOutlet, CommonModule],
  templateUrl: './default-layout.component.html',
  styleUrl: './default-layout.component.scss'
})
export class DefaultLayoutComponent implements OnInit {
  private readonly _authService: AuthService = inject(AuthService);
  router: Router = inject(Router);

  currentUser?: User;
  loading: boolean = false;
  isSidebarExpanded = true;

  toggleSidebar() {
    this.isSidebarExpanded = !this.isSidebarExpanded;
    this._setSidebarWidth();
  }

  ngOnInit() {
    this.loading = true;
    this._getCurrentUserDate();

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        if (!this.currentUser) {
          this._getCurrentUserDate();
        }
      });
  }

  private _getCurrentUserDate() {
    if (this._authService.isLogged) {
      this._authService
        .getLoggedUserData()
        .pipe(finalize(() => (this.loading = false)))
        .subscribe({
          next: (res) => {
            this.currentUser = res?.data;
            this._setSidebarWidth(); // aplicar ancho cuando se tenga el usuario
          }
        });
    } else {
      this.loading = false;
      this._setSidebarWidth(); // asegurarse de ocultar el sidebar
    }
  }

  private _setSidebarWidth() {
    if (this.currentUser) {
      const width = this.isSidebarExpanded ? '300px' : '75px';
      document.documentElement.style.setProperty('--sidebar-width', width);
    } else {
      document.documentElement.style.setProperty('--sidebar-width', '0px');
    }
  }

  logout() {
    this._authService.logout();
    this.currentUser = undefined;
    this._setSidebarWidth(); // quitar espacio del sidebar
  }
}
