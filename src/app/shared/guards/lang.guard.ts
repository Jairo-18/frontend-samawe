import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { LangService, Lang, SUPPORTED_LANGS, DEFAULT_LANG } from '../services/lang.service';
import { SeoService } from '../services/seo.service';

export const langGuard: CanActivateFn = (route) => {
  const lang = route.data['lang'] as Lang;
  if (SUPPORTED_LANGS.includes(lang)) {
    inject(LangService).init(lang);
    inject(SeoService).initRouteCanonical();
    return true;
  }
  return inject(Router).createUrlTree([`/${DEFAULT_LANG}`]);
};
