import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { inject } from '@angular/core';
import { map } from 'rxjs/operators';
import { LangService } from '../services/lang.service';
export const isLoggedGuard: CanActivateFn = () => {
  const authService: AuthService = inject(AuthService);
  const router: Router = inject(Router);
  const lang = inject(LangService).detectPreferred();
  return authService.isAuthenticatedToGuard().pipe(
    map((isAuthenticated) => {
      if (isAuthenticated) {
        router.navigate([`/${lang}`]);
        return false;
      }
      return true;
    })
  );
};

