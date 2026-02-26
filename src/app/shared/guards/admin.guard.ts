import { CanActivateFn, Router } from '@angular/router';
import { LocalStorageService } from '../services/localStorage.service';
import { inject } from '@angular/core';
const KNOWN_ROLES = ['administrador', 'recepcionista', 'chef', 'mesero'];
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
