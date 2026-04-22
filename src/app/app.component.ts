import {
  Component,
  Inject,
  inject,
  OnDestroy,
  PLATFORM_ID
} from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { MatIconRegistry } from '@angular/material/icon';
import { isPlatformBrowser } from '@angular/common';
import { Subscription } from 'rxjs';
import { environment } from '../environments/environment';
import { ApplicationService } from './organizational/services/application.service';
import { AuthService } from './auth/services/auth.service';
import { RelatedDataService } from './shared/services/relatedData.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnDestroy {
  private readonly _iconRegistry: MatIconRegistry = inject(MatIconRegistry);
  private readonly _router: Router = inject(Router);
  private readonly _meta: Meta = inject(Meta);
  private readonly _applicationService: ApplicationService =
    inject(ApplicationService);
  private readonly _authService: AuthService = inject(AuthService);
  private readonly _relatedDataService: RelatedDataService =
    inject(RelatedDataService);
  private _routerSubscription!: Subscription;

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    if (environment.production) {
      this._meta.addTag({
        httpEquiv: 'Content-Security-Policy',
        content: 'upgrade-insecure-requests'
      });
    }
    this._setMaterialOutlinedIconsDefault();
    this._listenRouterChanges();
    if (isPlatformBrowser(this.platformId)) {
      this._loadInitialBranding();
      this._relatedDataService.getRelatedData().subscribe();
      this._authService.scheduleTokenRefresh();
    }
  }

  private _loadInitialBranding(): void {
    this._applicationService.loadBrandingBySlug('ecohotelsamawe');
  }
  private _setMaterialOutlinedIconsDefault(): void {
    this._iconRegistry.setDefaultFontSetClass('material-icons');
  }
  private _listenRouterChanges(): void {
    this._routerSubscription = this._router.events.subscribe(
      (event: unknown): void => {
        if (event instanceof NavigationEnd) {
          this._setScrollOnTop();
        }
      }
    );
  }
  private _setScrollOnTop(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }
  ngOnDestroy(): void {
    this._routerSubscription.unsubscribe();
  }
}
