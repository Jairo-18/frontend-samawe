/* eslint-disable @typescript-eslint/no-unused-vars */
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { inject } from '@angular/core';
import { map } from 'rxjs/operators';

export const isLoggedGuard: CanActivateFn = (route, state) => {
  const authService: AuthService = inject(AuthService);
  const router: Router = inject(Router);

  return authService.isAuthenticatedToGuard().pipe(
    map((isAuthenticated) => {
      console.log(isAuthenticated);

      if (isAuthenticated) {
        router.navigate(['/invoices/see-invoices']);
        return false;
      }
      return true;
    })
  );
};
