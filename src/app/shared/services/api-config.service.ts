/* eslint-disable @typescript-eslint/no-explicit-any */
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';
export interface ApiConfig {
  apiUrl: string;
}
/**
 * Hotel elegido con `?hotel=<slug>` en el login. Es solo una PISTA para el
 * login (en qué hotel buscar la cuenta: el mismo correo puede existir en
 * varios) y para la marca de la pantalla de login. Todas las peticiones van a
 * la misma API: en el host del panel, con sesión, el backend opera en el hotel
 * del usuario (`organization_domains.isPanel`).
 */
const HOTEL_KEY = 'api-hotel';
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
  /** Hotel elegido para el login, o `null` (Samawe). */
  getLoginHotel(): LoginHotel | null {
    if (!this.isBrowser) return null;
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(HOTEL_KEY);
    } catch {
      return null;
    }
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as LoginHotel;
      return parsed?.slug ? parsed : null;
    } catch {
      // Formato viejo: solo el slug.
      return { slug: raw, name: raw };
    }
  }

  setLoginHotel(hotel: LoginHotel | null): void {
    if (!this.isBrowser) return;
    try {
      if (hotel) localStorage.setItem(HOTEL_KEY, JSON.stringify(hotel));
      else localStorage.removeItem(HOTEL_KEY);
    } catch {
      /* sin almacenamiento: queda solo para esta pestaña */
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
