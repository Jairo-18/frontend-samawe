import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable, catchError, map, of } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import { LocalStorageService } from '../services/localStorage.service';
import { LangService } from '../services/lang.service';
import { ApiConfigService } from '../services/api-config.service';
import { ApplicationService } from '../../organizational/services/application.service';

/** Roles de cocina y mesas: no ven Reportes, su vista es la del restaurante. */
const KITCHEN_ROLES = ['CHE', 'MES'];

/** Página del panel que hace de "Inicio" para el personal de otro hotel. */
export function panelHomeFor(roleCode: string | null | undefined): string {
  return KITCHEN_ROLES.includes(roleCode ?? '')
    ? '/recipes/restaurant-order'
    : '/sales/earnings-sumary';
}

/**
 * `/home` ("Inicio" del menú, y a donde se llega al iniciar sesión).
 *
 * Para Samawe es su web pública (`/es`), como siempre. Para el personal de
 * OTRO hotel es una página del panel: la web de este dominio es la de Samawe,
 * y abrirla les cambiaba el logo y la tipografía de todo el panel a los de
 * Samawe (la marca es una sola para el menú y para la página).
 */
export const homeRedirectGuard: CanActivateFn = (): Observable<UrlTree> | UrlTree => {
  const router = inject(Router);
  const auth = inject(AuthService);
  const storage = inject(LocalStorageService);
  const apiConfig = inject(ApiConfigService);
  const application = inject(ApplicationService);
  const publicHome = router.createUrlTree([`/${inject(LangService).detectPreferred()}`]);

  const orgId = auth.getOrganizationalId();
  if (!orgId) return publicHome;
  const decide = (samaweId: string | null | undefined): UrlTree =>
    samaweId && orgId !== samaweId
      ? router.createUrlTree([panelHomeFor(storage.getUserData()?.roleType?.code)])
      : publicHome;

  const known = apiConfig.defaultOrganizationalId;
  if (known) return decide(known);
  // Al recargar justo en /home el branding de Samawe puede no haber llegado.
  return application.getOrganizationBySlug('ecohotelsamawe').pipe(
    map((res) => decide(res.data?.organizationalId)),
    catchError(() => of(publicHome))
  );
};
