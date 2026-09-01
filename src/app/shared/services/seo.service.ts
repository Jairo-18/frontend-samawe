import { inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { filter } from 'rxjs';
import { Organizational } from '../interfaces/organizational.interface';
import { TranslatedField } from '../types/translated-field.type';
import { LangService } from './lang.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly _title: Title = inject(Title);
  private readonly _meta: Meta = inject(Meta);
  private readonly _document: Document = inject(DOCUMENT);
  private readonly _router: Router = inject(Router);
  private readonly _lang: LangService = inject(LangService);

  /**
   * Origen canónico fijo. Antes se leía de `document.location`, pero en SSR eso
   * devuelve el host interno del servidor de render (p. ej. http://localhost:4000),
   * así que el HTML que recibía Googlebot llevaba canonical y hreflang apuntando
   * a un dominio inexistente.
   */
  private readonly _origin = environment.siteUrl.replace(/\/+$/, '');

  /** Evita duplicar la suscripción a NavigationEnd si applyFromOrg se llama más de una vez. */
  private _urlSyncStarted = false;

  private _resolve(field: TranslatedField | undefined): string {
    if (!field) return '';
    const lang = this._lang.lang();
    return field[lang] ?? field['es'] ?? Object.values(field)[0] ?? '';
  }

  /**
   * Los títulos por página del panel son encabezados de display ("Sabores de
   * la Tierra", "Tu Refugio Privado"): sin marca no compiten por búsquedas del
   * hotel. Se les añade el nombre del sitio salvo que ya lo mencionen.
   */
  private _withBrand(title: string): string {
    const clean = title.trim();
    if (!clean) return '';
    const lower = clean.toLowerCase();
    const mentionsBrand = lower.includes('samawe') || lower.includes('samawé');
    return mentionsBrand ? clean : `${clean} | Eco Hotel Samawé`;
  }

  /** Ruta actual sin query ni fragmento, siempre con barra inicial. */
  private _currentPath(): string {
    const path = this._router.url.split(/[?#]/)[0];
    return path.startsWith('/') ? path : `/${path}`;
  }

  /** URL absoluta canónica de la ruta actual (sin barra final salvo la raíz). */
  private _absoluteUrl(path = this._currentPath()): string {
    const clean = path === '/' ? '' : path.replace(/\/+$/, '');
    return `${this._origin}${clean}`;
  }

  /**
   * Escribe canonical + hreflang + og:url de la ruta actual. Se dispara en cada
   * NavigationEnd para que el valor corresponda a la URL ya resuelta: llamarlo
   * desde un guard lo ejecutaba antes de que el router actualizara `url`, y
   * todas las páginas terminaban declarando la raíz como canónica.
   */
  private _syncUrls(): void {
    const url = this._absoluteUrl();
    this._updateCanonical(url);
    this._updateMeta('property', 'og:url', url);
    this._updateHreflang(this._currentPath());
  }

  private _startUrlSync(): void {
    if (this._urlSyncStarted) return;
    this._urlSyncStarted = true;
    this._router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this._syncUrls());
  }

  applyFromOrg(org: Organizational): void {
    const title = this._resolve(org.metaTitle).trim() || org.name;
    const description = this._resolve(org.metaDescription).trim() || this._resolve(org.description);
    const image = this._resolveOgImage(org);

    this._title.setTitle(title);
    this._updateMeta('name', 'description', description);
    this._updateMeta('name', 'theme-color', org.primaryColor || '#2E7D32');
    this._updateMeta('property', 'og:title', title);
    this._updateMeta('property', 'og:description', description);
    this._updateMeta('property', 'og:image', image);
    this._updateMeta('property', 'og:site_name', org.name);
    this._updateMeta('name', 'twitter:title', title);
    this._updateMeta('name', 'twitter:description', description);
    this._updateMeta('name', 'twitter:image', image);
    this._syncUrls();
    this._startUrlSync();
  }

  updatePage(title: TranslatedField | string | undefined, description: TranslatedField | string | undefined): void {
    const rawTitle = title ? (typeof title === 'string' ? title : this._resolve(title)) : '';
    const resolvedTitle = this._withBrand(rawTitle);
    const resolvedDesc = description ? (typeof description === 'string' ? description : this._resolve(description)) : '';
    if (resolvedTitle) {
      this._title.setTitle(resolvedTitle);
      this._updateMeta('property', 'og:title', resolvedTitle);
      this._updateMeta('name', 'twitter:title', resolvedTitle);
    }
    if (resolvedDesc) {
      this._updateMeta('name', 'description', resolvedDesc);
      this._updateMeta('property', 'og:description', resolvedDesc);
      this._updateMeta('name', 'twitter:description', resolvedDesc);
    }
  }

  updatePageCanonical(path: string): void {
    const clean = path ? (path.startsWith('/') ? path : `/${path}`) : '/';
    const url = this._absoluteUrl(clean);
    this._updateCanonical(url);
    this._updateMeta('property', 'og:url', url);
    this._updateHreflang(clean);
  }

  /**
   * Se invoca desde el langGuard, que corre ANTES de que el router publique la
   * URL nueva. Por eso aquí solo se deja armada la sincronización por
   * NavigationEnd: escribir el canonical en este punto lo fijaba en la raíz.
   */
  initRouteCanonical(): void {
    this._startUrlSync();
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

  private _updateHreflang(routerPath: string): void {
    const path = routerPath.split(/[?#]/)[0];

    // Ruta sin prefijo de idioma ('' para la portada), para reconstruir cada
    // variante. Si la ruta no lleva prefijo no es una página pública
    // traducible, así que no se anuncian alternativas.
    const match = /^\/(es|en)(\/.*)?$/.exec(path);
    if (!match) return;

    const rest = match[2] ?? '';
    const esUrl = this._absoluteUrl(`/es${rest}`);
    const enUrl = this._absoluteUrl(`/en${rest}`);

    this._setAlternateLink('es', esUrl);
    this._setAlternateLink('en', enUrl);
    // x-default debe apuntar a una URL que responda 200. Antes apuntaba al
    // dominio raíz, que hace 301 hacia /es: Google descarta los hreflang que
    // resuelven en redirección y terminaba eligiendo su propia canónica
    // (el caso de /en/accommodation en Search Console). Además así coincide
    // con lo que declara sitemap.xml para las páginas internas.
    this._setAlternateLink('x-default', esUrl);
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
