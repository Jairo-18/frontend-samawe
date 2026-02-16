import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ApiConfigService } from '../services/api-config.service';
import { environment } from '../../../environments/environment';

/**
 * Interceptor que reemplaza la URL base del API con la configuración dinámica
 * Esto permite que las tablets puedan conectarse a diferentes servidores
 */
export const apiUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const apiConfigService = inject(ApiConfigService);

  // Solo modificar URLs que apunten al API (empiezan con environment.apiUrl)
  if (req.url.startsWith(environment.apiUrl)) {
    const dynamicApiUrl = apiConfigService.getApiUrl();

    // Reemplazar la URL base por la configuración dinámica
    const newUrl = req.url.replace(environment.apiUrl, dynamicApiUrl);

    const modifiedReq = req.clone({
      url: newUrl
    });

    return next(modifiedReq);
  }

  // Si la URL no empieza con environment.apiUrl, pasarla sin modificar
  return next(req);
};
