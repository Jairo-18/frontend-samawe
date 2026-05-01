import {
  ApplicationConfig,
  importProvidersFrom,
  LOCALE_ID,
  provideZoneChangeDetection
} from '@angular/core';
import { RouteReuseStrategy } from '@angular/router';
import { CacheRouteReuseStrategy } from './shared/strategies/cache-route-reuse.strategy';
import { provideRouter } from '@angular/router';
import {
  ErrorStateMatcher,
  MAT_DATE_LOCALE,
  MAT_NATIVE_DATE_FORMATS,
  provideNativeDateAdapter
} from '@angular/material/core';
import { ToastrModule } from 'ngx-toastr';
import { routes } from './app.routes';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { getMaterialPaginatorTranslations } from './shared/utilities/material-paginator-translations';
import { MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { TransformDateService } from './shared/services/transform-date.service';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { MyErrorStateMatcher } from './shared/matchers/error-state.matcher';
import { authInterceptor } from './shared/interceptors/auth.interceptor';
import { notificationsInterceptorInterceptor } from './shared/interceptors/notifications.interceptor.interceptor';
import { apiUrlInterceptor } from './shared/interceptors/api-url.interceptor';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import esTranslations from '../assets/i18n/es.json';
import enTranslations from '../assets/i18n/en.json';

const TRANSLATIONS: Record<string, object> = { es: esTranslations, en: enTranslations };

class InlineTranslateLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<object> {
    return of(TRANSLATIONS[lang] ?? TRANSLATIONS['es']);
  }
}

registerLocaleData(localeEs);
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideNativeDateAdapter(MAT_NATIVE_DATE_FORMATS),
    provideAnimationsAsync(),
    importProvidersFrom(
      ToastrModule.forRoot({ preventDuplicates: true }),
      TranslateModule.forRoot({
        defaultLanguage: 'es',
        loader: { provide: TranslateLoader, useClass: InlineTranslateLoader }
      })
    ),
    { provide: MatPaginatorIntl, useValue: getMaterialPaginatorTranslations() },
    {
      provide: MAT_DIALOG_DEFAULT_OPTIONS,
      useValue: { maxWidth: '700px', width: '95vw' }
    },
    { provide: LOCALE_ID, useValue: 'es' },
    { provide: MAT_DATE_LOCALE, useValue: 'es-CO' },
    { provide: ErrorStateMatcher, useValue: new MyErrorStateMatcher() },
    provideClientHydration(withEventReplay()),
    provideHttpClient(
      withFetch(),
      withInterceptors([
        apiUrlInterceptor,
        authInterceptor,
        notificationsInterceptorInterceptor
      ])
    ),
    TransformDateService,
    { provide: RouteReuseStrategy, useClass: CacheRouteReuseStrategy }
  ]
};
