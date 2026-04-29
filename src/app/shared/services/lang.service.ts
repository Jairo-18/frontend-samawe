import { inject, Injectable, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';

export type Lang = 'es' | 'en';
export const SUPPORTED_LANGS: Lang[] = ['es', 'en'];
export const DEFAULT_LANG: Lang = 'es';

@Injectable({ providedIn: 'root' })
export class LangService {
  private readonly _translate = inject(TranslateService);
  private readonly _router = inject(Router);
  private readonly _document = inject(DOCUMENT);
  private readonly _platformId = inject(PLATFORM_ID);

  private readonly _lang = signal<Lang>(DEFAULT_LANG);
  readonly lang = this._lang.asReadonly();

  init(lang: Lang): void {
    this._lang.set(lang);
    this._translate.use(lang);
    this._document.documentElement.lang = lang;
    if (isPlatformBrowser(this._platformId)) {
      localStorage.setItem('lang', lang);
    }
  }

  /** Reads stored preference (browser only). Falls back to DEFAULT_LANG. */
  detectPreferred(): Lang {
    if (isPlatformBrowser(this._platformId)) {
      const stored = localStorage.getItem('lang') as Lang;
      if (stored && SUPPORTED_LANGS.includes(stored)) return stored;
      const browser = (navigator.language ?? '').split('-')[0] as Lang;
      if (SUPPORTED_LANGS.includes(browser)) return browser;
    }
    return DEFAULT_LANG;
  }

  /** Switches to the other language and navigates to the equivalent URL. */
  switch(): void {
    const next: Lang = this._lang() === 'es' ? 'en' : 'es';
    const current = this._lang();
    const url = this._router.url;
    const newUrl = url.replace(new RegExp(`^/${current}(/|$)`), `/${next}$1`);
    this.init(next);
    this._router.navigateByUrl(newUrl.startsWith('/') ? newUrl : `/${next}`);
  }

  /** Returns the lang-prefixed absolute path for a given segment. */
  route(path: string): string {
    const clean = path.startsWith('/') ? path.slice(1) : path;
    return clean ? `/${this._lang()}/${clean}` : `/${this._lang()}`;
  }
}
