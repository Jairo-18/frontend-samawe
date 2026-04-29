import { inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { filter } from 'rxjs';
import { Organizational } from '../interfaces/organizational.interface';
import { TranslatedField } from '../types/translated-field.type';
import { LangService } from './lang.service';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly _title: Title = inject(Title);
  private readonly _meta: Meta = inject(Meta);
  private readonly _document: Document = inject(DOCUMENT);
  private readonly _router: Router = inject(Router);
  private readonly _lang: LangService = inject(LangService);

  private _resolve(field: TranslatedField | undefined): string {
    if (!field) return '';
    const lang = this._lang.lang();
    return field[lang] ?? field['es'] ?? Object.values(field)[0] ?? '';
  }

  applyFromOrg(org: Organizational): void {
    const title = this._resolve(org.metaTitle).trim() || org.name;
    const description = this._resolve(org.metaDescription).trim() || this._resolve(org.description);
    const pageUrl = this._document.location.href;
    const image = this._resolveOgImage(org);

    this._title.setTitle(title);
    this._updateMeta('name', 'description', description);
    this._updateMeta('name', 'theme-color', org.primaryColor || '#2E7D32');
    this._updateMeta('property', 'og:title', title);
    this._updateMeta('property', 'og:description', description);
    this._updateMeta('property', 'og:url', pageUrl);
    this._updateMeta('property', 'og:image', image);
    this._updateMeta('property', 'og:site_name', org.name);
    this._updateMeta('name', 'twitter:title', title);
    this._updateMeta('name', 'twitter:description', description);
    this._updateMeta('name', 'twitter:image', image);
    this._updateCanonical(pageUrl);
    this._updateHreflang(this._document.location.origin, this._router.url);

    this._router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        const url = `${this._document.location.origin}${this._router.url}`;
        this._updateCanonical(url);
        this._updateMeta('property', 'og:url', url);
        this._updateHreflang(this._document.location.origin, this._router.url);
      });
  }

  updatePageCanonical(path: string): void {
    const origin = this._document.location.origin;
    const url = path ? `${origin}/${path}` : origin;
    this._updateCanonical(url);
    this._updateMeta('property', 'og:url', url);
  }

  private _updateMeta(
    attr: 'name' | 'property',
    key: string,
    value: string
  ): void {
    if (!value) return;
    const selector = `${attr}="${key}"`;
    if (this._meta.getTag(selector)) {
      this._meta.updateTag({ [attr]: key, content: value });
    } else {
      this._meta.addTag({ [attr]: key, content: value });
    }
  }

  private _updateHreflang(origin: string, routerUrl: string): void {
    const path = routerUrl.split('?')[0];
    const esPath = path.startsWith('/en/') ? path.replace(/^\/en\//, '/es/') : path.startsWith('/en') ? '/es' : path;
    const enPath = path.startsWith('/es/') ? path.replace(/^\/es\//, '/en/') : path.startsWith('/es') ? '/en' : path;

    this._setAlternateLink('es', `${origin}${esPath}`);
    this._setAlternateLink('en', `${origin}${enPath}`);
    this._setAlternateLink('x-default', `${origin}${esPath}`);
  }

  private _setAlternateLink(hreflang: string, href: string): void {
    const existing = this._document.querySelector<HTMLLinkElement>(
      `link[rel="alternate"][hreflang="${hreflang}"]`
    );
    if (existing) {
      existing.href = href;
    } else {
      const link = this._document.createElement('link');
      link.rel = 'alternate';
      link.setAttribute('hreflang', hreflang);
      link.href = href;
      this._document.head.appendChild(link);
    }
  }

  private _updateCanonical(url: string): void {
    if (!url) return;
    const canonical = this._document.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]'
    );
    if (canonical) {
      canonical.href = url;
    } else {
      const link = this._document.createElement('link');
      link.rel = 'canonical';
      link.href = url;
      this._document.head.appendChild(link);
    }
  }

  private _resolveOgImage(org: Organizational): string {
    const preferred = ['HOME_BG', 'HERO', 'LOGO', 'BANNER'];
    for (const code of preferred) {
      const found = org.medias?.find(
        (m) => m.mediaType.code === code && m.isActive && m.url
      );
      if (found) return found.url;
    }

    const first = org.medias?.find((m) => m.isActive && m.url);
    return first?.url || '';
  }
}
