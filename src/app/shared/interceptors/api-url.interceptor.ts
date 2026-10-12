import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ApiConfigService } from '../services/api-config.service';
import { environment } from '../../../environments/environment';
export const apiUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const apiConfigService = inject(ApiConfigService);
  if (req.url.startsWith(environment.apiUrl)) {
    const dynamicApiUrl = apiConfigService.getApiUrl();
    const newUrl = req.url.replace(environment.apiUrl, dynamicApiUrl);
    const modifiedReq = req.clone({
      url: newUrl
    });
    return next(modifiedReq);
  }
  return next(req);
};

