import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';
import { LocalStorageService } from '../services/localStorage.service';

export const pendingProfileGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const localStorageService = inject(LocalStorageService);

  if (!authService.isAuthenticated()) {
    router.navigate(['/auth/login']);
    return false;
  }

  if (!localStorageService.getItem('_pendingGoogleProfile')) {
    router.navigate(['/home']);
    return false;
  }

  return true;
};
