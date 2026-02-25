import { CanActivateFn, Router } from '@angular/router';
import { LocalStorageService } from '../services/localStorage.service';
import { inject } from '@angular/core';
const RESTAURANT_ROLES = ['administrador', 'recepcionista', 'chef', 'mesero'];

export const restaurantGuard: CanActivateFn = () => {
  const localStorageService = inject(LocalStorageService);
  const router = inject(Router);

  const userData = localStorageService.getUserData();
  const roleName = userData?.roleType?.name?.toLowerCase();

  if (!roleName || !RESTAURANT_ROLES.includes(roleName)) {
    router.navigate(['/home']);
    return false;
  }

  return true;
};

