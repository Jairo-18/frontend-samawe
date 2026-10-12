import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable, catchError, map, of } from 'rxjs';
import { LocalStorageService } from '../services/localStorage.service';
import { LangService } from '../services/lang.service';
import { ApiConfigService } from '../services/api-config.service';
import { ApplicationService } from '../../organizational/services/application.service';

/** Roles del personal (los mismos de `adminGuard`). */
const STAFF_CODES = ['ADMIN', 'SUPERADMIN', 'EMP', 'MES', 'CHE'];

/** "Inicio" del panel: saludo y accesos rápidos (`PanelHomeComponent`). */
export const PANEL_HOME_ROUTE = '/dashboard';

/**
 * `/home` ("Inicio" del menú, y a donde se llega al iniciar sesión).
 *
 * - Personal de CUALQUIER hotel: el inicio del panel, con los accesos rápidos
 *   y la marca de su hotel. Antes iba a la portada pública (`/es`), que es la
 *   web de Samawe: a otro hotel le cambiaba el panel a la marca de Samawe.
 * - Cliente cuya sesión es de otro hotel (entró por `?hotel=`): la web de SU
 *   hotel si la organización la tiene cargada, no la de Samawe.
 * - Resto (clientes de Samawe, visitantes): la web pública, como siempre.
 */
export const homeRedirectGuard: CanActivateFn = (): Observable<UrlTree | boolean> | UrlTree => {
  const router = inject(Router);
  const code = inject(LocalStorageService).getUserData()?.roleType?.code;
  const publicHome = router.createUrlTree([`/${inject(LangService).detectPreferred()}`]);
  if (STAFF_CODES.includes(code ?? '')) return router.createUrlTree([PANEL_HOME_ROUTE]);

  const hotel = inject(ApiConfigService).getSessionHotel();
  if (!hotel || !isPlatformBrowser(inject(PLATFORM_ID))) return publicHome;
  return inject(ApplicationService)
    .getOrganizationBySlug(hotel)
    .pipe(
      map((res) => {
        const site = res.data?.website?.trim();
        if (!site) return publicHome;
        window.location.assign(/^https?:\/\//i.test(site) ? site : `https://${site}`);
        return false;
      }),
      catchError(() => of(publicHome))
    );
};
