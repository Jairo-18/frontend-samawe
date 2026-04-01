import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { UserInterface } from '../../../shared/interfaces/user.interface';
import { LocalStorageService } from '../../../shared/services/localStorage.service';
import { AuthService } from '../../../auth/services/auth.service';
import { BasePageComponent } from '../../../shared/components/base-page/base-page.component';
import { CardHomeComponent } from '../../components/card-home/card-home.component';
import { ApplicationService } from '../../../organizational/services/application.service';
import { Organizational } from '../../../shared/interfaces/organizational.interface';
import { HeroSectionComponent } from './components/hero-section/hero-section.component';
import { ExperienceSectionComponent } from './components/experience-section/experience-section.component';
import { AboutUsSectionComponent } from './components/about-us-section/about-us-section.component';
import { ReservationSectionComponent } from './components/reservation-section/reservation-section.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    BasePageComponent,
    CardHomeComponent,
    HeroSectionComponent,
    ExperienceSectionComponent,
    AboutUsSectionComponent,
    ReservationSectionComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly _subscription: Subscription = new Subscription();
  private readonly _authService: AuthService = inject(AuthService);
  private readonly _localStorage: LocalStorageService = inject(LocalStorageService);
  private readonly _router: Router = inject(Router);
  private readonly _applicationService: ApplicationService = inject(ApplicationService);

  isLoggedUser: boolean = false;
  userInfo?: UserInterface;
  org: Organizational | null = null;

  ngOnInit(): void {
    this._subscription.add(
      this._authService._isLoggedSubject.subscribe((isLogged) => {
        this.isLoggedUser = isLogged;
        this.userInfo = this._localStorage.getUserData();
      })
    );

    this.isLoggedUser = this._authService.isAuthenticated();
    this.userInfo = this._localStorage.getUserData();

    this._router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.isLoggedUser = this._authService.isAuthenticated();
        this.userInfo = this._localStorage.getUserData();
      });

    this._subscription.add(
      this._applicationService.currentOrg$.subscribe((org) => {
        if (org) {
          this.org = org;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }
}
