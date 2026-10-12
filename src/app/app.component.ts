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
import { AsyncPipe, isPlatformBrowser } from '@angular/common';
import { Subscription } from 'rxjs';
import { environment } from '../environments/environment';
import { ApplicationService } from './organizational/services/application.service';
import { AuthService } from './auth/services/auth.service';
import { RelatedDataService } from './shared/services/relatedData.service';
import { ThemeService } from './shared/services/theme.service';
import { ApiConfigService } from './shared/services/api-config.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AsyncPipe],
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
  private readonly _themeService: ThemeService = inject(ThemeService);
  private readonly _apiConfig: ApiConfigService = inject(ApiConfigService);
  /** Qué marca está aplicada: 'public' (Samawe), 'hotel:<slug>' (login) o un id de organización. */
  private _brandingKey: string | null = null;
  readonly brandingLoading$ = this._applicationService.brandingLoading$;
  private _routerSubscription!: Subscription;

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    // Modo claro/oscuro: se resuelve al arrancar, antes de pintar nada. Sigue
    // al sistema salvo que la persona haya elegido con el interruptor.
    this._themeService.init();

    if (environment.production) {
      this._meta.addTag({
        httpEquiv: 'Content-Security-Policy',
        content: 'upgrade-insecure-requests'
      });
    }
    this._setMaterialOutlinedIconsDefault();
    this._listenRouterChanges();
    // El branding también se carga en el servidor: de él salen el title y la
    // meta description de cada página. Cuando solo se pedía en el navegador,
    // el HTML renderizado en SSR (el que ve Googlebot) se quedaba con el
    // title/description estáticos de index.html, idénticos en todas las rutas.
    // La respuesta viaja al cliente por transfer-state, así que no se repite.
    this._loadInitialBranding();
    if (isPlatformBrowser(this.platformId)) {
      this._relatedDataService.getRelatedData().subscribe();
      this._authService.scheduleTokenRefresh();
    }
  }

  /**
   * En el servidor, siempre Samawe: de ahí salen el title y la meta de la web
   * pública (lo que ve Googlebot). En el navegador se decide con la URL y la
   * sesión desde el primer momento, para no pedir primero la de Samawe y
   * después la del hotel (se veía un instante la marca equivocada).
   */
  private _loadInitialBranding(): void {
    if (isPlatformBrowser(this.platformId)) {
      this._syncBranding(window.location.pathname + window.location.search);
      return;
    }
    this._brandingKey = 'public';
    this._applicationService.loadBrandingBySlug('ecohotelsamawe');
  }

  /**
   * La web pública es de Samawe; el panel muestra la marca de la organización
   * de la sesión (otro hotel, o el que eligió un superadmin) y el login en
   * modo hotel, la de ese hotel. Solo recarga cuando cambia.
   */
  private _syncBranding(url: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const path = url.split(/[?#]/)[0];
    let key = 'public';
    if (!ApiConfigService.isPublicSitePath(path)) {
      const orgId = this._authService.getOrganizationalId();
      const defaultId = this._apiConfig.defaultOrganizationalId;
      if (orgId && orgId !== defaultId) key = orgId;
      else if (!orgId) {
        const hotel = ApiConfigService.hotelSlugFromUrl(url);
        if (hotel) key = `hotel:${hotel}`;
      }
    }
    if (key === this._brandingKey) return;
    this._brandingKey = key;
    // Si esa marca ya es la que se ve (p. ej. el panel de Samawe tras su web),
    // no se pide otra vez ni se tapa la pantalla.
    const current = this._applicationService.currentOrg;
    const target = key === 'public' ? 'ecohotelsamawe' : key.startsWith('hotel:') ? key.slice(6) : key;
    if (current && (current.slug === target || current.organizationalId === target)) return;
    // Loader solo fuera de la web pública: esa llega armada del servidor.
    const loader = key !== 'public';
    if (key === 'public') this._applicationService.loadBrandingBySlug('ecohotelsamawe');
    else if (key.startsWith('hotel:')) this._applicationService.loadBrandingBySlug(key.slice(6), loader);
    else this._applicationService.loadPanelBranding(key, loader);
  }
  private _setMaterialOutlinedIconsDefault(): void {
    this._iconRegistry.setDefaultFontSetClass('material-icons');
  }
  private _listenRouterChanges(): void {
    this._routerSubscription = this._router.events.subscribe(
      (event: unknown): void => {
        if (event instanceof NavigationEnd) {
          this._setScrollOnTop();
          this._syncBranding(event.urlAfterRedirects);
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
