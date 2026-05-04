import { CanActivateFn, Router } from '@angular/router';
import { LocalStorageService } from '../services/localStorage.service';
import { inject } from '@angular/core';
const RESTAURANT_CODES = ['ADMIN', 'SUPERADMIN', 'EMP', 'MES', 'CHE'];

export const restaurantGuard: CanActivateFn = () => {
  const localStorageService = inject(LocalStorageService);
  const router = inject(Router);

  const userData = localStorageService.getUserData();
  const code = userData?.roleType?.code;

  if (!code || !RESTAURANT_CODES.includes(code)) {
    router.navigate(['/home']);
    return false;
  }

  return true;
};

