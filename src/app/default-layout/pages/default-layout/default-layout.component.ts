import { Component, inject, OnInit } from '@angular/core';
import { SideBarComponent } from '../../components/side-bar/side-bar.component';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { User } from '../../../auth/interfaces/login.interface';
import { filter, finalize } from 'rxjs';

@Component({
  selector: 'app-default-layout',
  imports: [SideBarComponent, RouterOutlet],
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
    const width = this.isSidebarExpanded ? '300px' : '75px';
    document.documentElement.style.setProperty('--sidebar-width', width);
  }

  ngOnInit() {
    // Set initial CSS variable
    const width = this.isSidebarExpanded ? '300px' : '75px';
    document.documentElement.style.setProperty('--sidebar-width', width);

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
          }
        });
    } else {
      this.loading = false;
    }
  }

  logout() {
    this._authService.logout();
    this.currentUser = undefined;
  }
}
