import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavItem } from '../../../shared/interfaces/navBar.interface';
import { NAVBAR_CONST } from '../../../shared/constants/navbar.constans';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ApplicationService } from '../../../organizational/services/application.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [RouterLink, MatIconModule, MatMenuModule, CommonModule],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.scss'
})
export class NavBarComponent implements OnInit, OnDestroy {
  private readonly _applicationService: ApplicationService =
    inject(ApplicationService);
  private _subscription: Subscription = new Subscription();

  navBarItems: NavItem[] = NAVBAR_CONST;
  organizationalName: string = '';
  logoUrl: string = '';

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
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }
}
