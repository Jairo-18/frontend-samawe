import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import {
  ApiConfigService,
  WITHOUT_SESSION
} from '../services/api-config.service';
import { environment } from '../../../environments/environment';
export const apiUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const apiConfigService = inject(ApiConfigService);
  if (req.url.startsWith(environment.apiUrl)) {
    // La API del hotel elegido, salvo lo que es de Samawe (ver `routeFor`).
    const route = apiConfigService.routeFor(req.url);
    const newUrl = req.url.replace(environment.apiUrl, route.apiUrl);
    const modifiedReq = req.clone({
      url: newUrl,
      context: route.withSession ? req.context : req.context.set(WITHOUT_SESSION, true)
    });
    return next(modifiedReq);
  }
  return next(req);
};

