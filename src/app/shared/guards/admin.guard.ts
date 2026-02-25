import { CanActivateFn, Router } from '@angular/router';
import { LocalStorageService } from '../services/localStorage.service';
import { inject } from '@angular/core';

/** Roles conocidos del sistema que tienen acceso a la aplicación */
const KNOWN_ROLES = ['administrador', 'recepcionista', 'chef', 'mesero'];

/**
 * Guard de acceso general a módulos.
 * Permite el acceso a cualquier usuario con un rol válido.
 * La visibilidad de items del menú es controlada por ROLE_PERMISSIONS.
 */
export const adminGuard: CanActivateFn = () => {
  const localStorageService = inject(LocalStorageService);
  const router = inject(Router);

  const userData = localStorageService.getUserData();
  const roleName = userData?.roleType?.name?.toLowerCase();

  if (!roleName || !KNOWN_ROLES.includes(roleName)) {
    router.navigate(['/']);
    return false;
  }

  return true;
};
