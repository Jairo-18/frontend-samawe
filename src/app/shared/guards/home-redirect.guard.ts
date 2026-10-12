import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { LocalStorageService } from '../services/localStorage.service';
import { LangService } from '../services/lang.service';

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
 * - Clientes y visitantes: la web pública, como siempre.
 */
export const homeRedirectGuard: CanActivateFn = (): UrlTree => {
  const router = inject(Router);
  const code = inject(LocalStorageService).getUserData()?.roleType?.code;
  return STAFF_CODES.includes(code ?? '')
    ? router.createUrlTree([PANEL_HOME_ROUTE])
    : router.createUrlTree([`/${inject(LangService).detectPreferred()}`]);
};
