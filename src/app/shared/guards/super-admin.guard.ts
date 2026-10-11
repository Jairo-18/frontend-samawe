import { CanActivateFn, Router } from '@angular/router';
import { LocalStorageService } from '../services/localStorage.service';
import { inject } from '@angular/core';

/**
 * Vistas de plataforma (p. ej. Organizaciones). Es solo de pantalla: quien
 * decide es el backend, que exige el mismo rol en cada endpoint.
 */
const PLATFORM_CODES = ['SUPERADMIN', 'PLATFORM_ADMIN'];

export const superAdminGuard: CanActivateFn = () => {
  const localStorageService = inject(LocalStorageService);
  const router = inject(Router);
  const code = localStorageService.getUserData()?.roleType?.code;
  if (!code || !PLATFORM_CODES.includes(code)) {
    router.navigate(['/home']);
    return false;
  }
  return true;
};
