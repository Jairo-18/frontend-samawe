import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { inject } from '@angular/core';
import { map } from 'rxjs/operators';

/**
 * Guard de autenticación.
 * Solo verifica que el usuario tenga una sesión válida.
 * El control de acceso por rol se maneja en ROLE_PERMISSIONS (menú)
 * y en guards específicos de módulo cuando sea necesario.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const authGuard: CanActivateFn = (route, state) => {
  const authService: AuthService = inject(AuthService);
  const router: Router = inject(Router);

  return authService.isAuthenticatedToGuard().pipe(
    map((isAuthenticated) => {
      if (!isAuthenticated) {
        router.navigate(['/auth/login']);
        return false;
      }
      return true;
    })
  );
};
