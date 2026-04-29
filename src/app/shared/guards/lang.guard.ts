import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { LangService, Lang, SUPPORTED_LANGS } from '../services/lang.service';

export const langGuard: CanActivateFn = (route) => {
  const lang = route.data['lang'] as Lang;
  if (SUPPORTED_LANGS.includes(lang)) {
    inject(LangService).init(lang);
    return true;
  }
  return inject(Router).createUrlTree(['/es']);
};
