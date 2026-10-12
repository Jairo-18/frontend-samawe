import { CanActivateFn, Router } from '@angular/router';
import { LocalStorageService } from '../services/localStorage.service';
import { inject } from '@angular/core';
const STAFF_CODES = ['ADMIN', 'SUPERADMIN', 'EMP', 'MES', 'CHE'];
export const adminGuard: CanActivateFn = () => {
  const localStorageService = inject(LocalStorageService);
  const router = inject(Router);
  const userData = localStorageService.getUserData();
  const code = userData?.roleType?.code;
  if (!code || !STAFF_CODES.includes(code)) {
    // A `/home` y no a `/`: decide según el hotel (con la sesión de otro hotel,
    // `/` era la web de Samawe).
    router.navigate(['/home']);
    return false;
  }
  return true;
};
