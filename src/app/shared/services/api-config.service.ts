/* eslint-disable @typescript-eslint/no-explicit-any */
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';
export interface ApiConfig {
  apiUrl: string;
}
/**
 * Login de OTRO hotel: `/:lang/auth/...?hotel=<slug>`. El modo hotel sale SOLO
 * de la URL (no se guarda en el navegador): sin `?hotel=`, o cortando la URL,
 * todo vuelve a ser de Samawe. El slug le dice al backend en qué hotel buscar
 * la cuenta (el mismo correo puede existir en varios) y da la marca del login.
 */
const DEFAULT_HOTEL_SLUG = 'ecohotelsamawe';
/** Hotel por el que se inició la sesión: para volver a SU login al salir. Se borra al cerrar sesión. */
const SESSION_HOTEL_KEY = 'session-hotel';
/** Versión anterior: el hotel se guardaba en el dispositivo. Se limpia al arrancar. */
const LEGACY_HOTEL_KEY = 'api-hotel';
export interface LoginHotel {
  slug: string;
  name: string;
}
@Injectable({
  providedIn: 'root'
})
export class ApiConfigService {
  private readonly _platformId = inject(PLATFORM_ID);
  private config: ApiConfig = {
    apiUrl: environment.apiUrl
  };
  constructor() {
    this.loadConfig();
    if (this.isBrowser) {
      try {
        localStorage.removeItem(LEGACY_HOTEL_KEY);
      } catch {
        /* sin almacenamiento */
      }
    }
  }
  private get isBrowser(): boolean {
    return isPlatformBrowser(this._platformId);
  }
  private loadConfig(): void {
    if (!environment.production) {
      this.config = { apiUrl: environment.apiUrl };
      return;
    }
    if (!this.isBrowser) return;
    const savedConfig = localStorage.getItem('api-config');
    if (savedConfig) {
      try {
        const parsed: ApiConfig = JSON.parse(savedConfig);
        if (this.isSiteSecure() && parsed.apiUrl?.startsWith('http://')) {
          localStorage.removeItem('api-config');
        } else {
          this.config = parsed;
          return;
        }
      } catch (e) {
        console.error('Error al parsear configuración guardada:', e);
      }
    }
    if ((window as any).__API_CONFIG__) {
      this.config = (window as any).__API_CONFIG__;
      return;
    }
  }
  /** Slug de `?hotel=` en una ruta de login/recuperación (`/:lang/auth/...`); `null` = Samawe. */
  static hotelSlugFromUrl(url: string): string | null {
    const [path, rest = ''] = url.split('?');
    if (!/^\/(es|en)\/auth(\/|$)/.test(path)) return null;
    const slug = new URLSearchParams(rest.split('#')[0]).get('hotel')?.trim().toLowerCase();
    return slug && slug !== DEFAULT_HOTEL_SLUG ? slug : null;
  }

  /** Nombre ya validado contra el backend (lo pone el login), para el aviso. */
  private _loginHotel: LoginHotel | null = null;

  /** Hotel del login de la URL ACTUAL, o `null` (Samawe). */
  getLoginHotel(): LoginHotel | null {
    if (!this.isBrowser) return null;
    const slug = ApiConfigService.hotelSlugFromUrl(window.location.pathname + window.location.search);
    if (!slug) return null;
    return this._loginHotel?.slug === slug ? this._loginHotel : { slug, name: slug };
  }

  setLoginHotel(hotel: LoginHotel | null): void {
    this._loginHotel = hotel;
  }

  getSessionHotel(): string | null {
    if (!this.isBrowser) return null;
    try {
      return localStorage.getItem(SESSION_HOTEL_KEY);
    } catch {
      return null;
    }
  }

  setSessionHotel(slug: string | null): void {
    if (!this.isBrowser) return;
    try {
      if (slug) localStorage.setItem(SESSION_HOTEL_KEY, slug);
      else localStorage.removeItem(SESSION_HOTEL_KEY);
    } catch {
      /* sin almacenamiento */
    }
  }

  /** Id de Samawe (sale del branding por slug): el panel de Samawe usa su marca pública. */
  private _defaultOrganizationalId: string | null = null;

  setDefaultOrganizationalId(id: string | null | undefined): void {
    this._defaultOrganizationalId = id ?? null;
  }

  get defaultOrganizationalId(): string | null {
    return this._defaultOrganizationalId;
  }

  /** Web pública (`/es/...`, `/en/...`) salvo login y perfil. */
  static isPublicSitePath(path: string): boolean {
    return (
      /^\/(es|en)(\/|$|\?|#)/.test(path) &&
      !/^\/(es|en)\/(auth|user|complete-profile)(\/|$|\?|#)/.test(path)
    );
  }

  getApiUrl(): string {
    return this.config.apiUrl;
  }
  setApiUrl(apiUrl: string): void {
    let url = apiUrl.endsWith('/') ? apiUrl : `${apiUrl}/`;
    if (this.isSiteSecure() && url.startsWith('http://')) {
      url = url.replace('http://', 'https://');
    }
    this.config.apiUrl = url;
    if (this.isBrowser) {
      localStorage.setItem('api-config', JSON.stringify(this.config));
    }
  }
  isUsingLocalhost(): boolean {
    return (
      this.config.apiUrl.includes('localhost') ||
      this.config.apiUrl.includes('127.0.0.1')
    );
  }
  resetConfig(): void {
    if (this.isBrowser) {
      localStorage.removeItem('api-config');
    }
    this.config = { apiUrl: environment.apiUrl };
  }
  getConfig(): ApiConfig {
    return { ...this.config };
  }
  private isSiteSecure(): boolean {
    if (!this.isBrowser) return false;
    return window.location.protocol === 'https:';
  }
}
