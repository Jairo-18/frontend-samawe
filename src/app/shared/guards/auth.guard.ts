import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { inject } from '@angular/core';
import { map } from 'rxjs/operators';
import { LocalStorageService } from '../services/localStorage.service';
import { LangService } from '../services/lang.service';

export const authGuard: CanActivateFn = () => {
  const authService: AuthService = inject(AuthService);
  const router: Router = inject(Router);
  const localStorageService: LocalStorageService = inject(LocalStorageService);
  const lang = inject(LangService).detectPreferred();
  return authService.isAuthenticatedToGuard().pipe(
    map((isAuthenticated) => {
      if (!isAuthenticated) {
        router.navigate([`/${lang}/auth/login`]);
        return false;
      }
      if (localStorageService.getItem('_pendingGoogleProfile')) {
        router.navigate([`/${lang}/complete-profile`]);
        return false;
      }
      return true;
    })
  );
};

