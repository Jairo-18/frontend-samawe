/* eslint-disable @typescript-eslint/no-explicit-any */
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';
export interface ApiConfig {
  apiUrl: string;
}
/** Hotel elegido con `?hotel=` en el login (slug de `environment.hotelApis`). */
const HOTEL_KEY = 'api-hotel';
export interface HotelApi {
  slug: string;
  name: string;
  apiUrl: string;
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
    // Hotel elegido: manda sobre todo lo demás, también en desarrollo.
    const hotel = this.getHotel();
    if (hotel) {
      this.config = { apiUrl: hotel.apiUrl };
      return;
    }
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
  /** Hotel activo distinto de Samawe, o `null`. */
  getHotel(): HotelApi | null {
    if (!this.isBrowser) return null;
    let slug: string | null = null;
    try {
      slug = localStorage.getItem(HOTEL_KEY);
    } catch {
      return null;
    }
    const hotel = slug ? environment.hotelApis[slug] : undefined;
    return slug && hotel ? { slug, ...hotel } : null;
  }

  /**
   * Elige el hotel con el que habla el panel. Un slug que no está en
   * `hotelApis` (por ejemplo `ecohotelsamawe`) vuelve a la API de Samawe.
   * Devuelve `true` si cambió la API: la sesión que hubiera era de otro hotel.
   */
  selectHotel(slug: string): boolean {
    if (!this.isBrowser) return false;
    const before = this.config.apiUrl;
    const hotel = environment.hotelApis[slug];
    try {
      if (hotel) localStorage.setItem(HOTEL_KEY, slug);
      else localStorage.removeItem(HOTEL_KEY);
    } catch {
      /* sin almacenamiento: queda solo para esta pestaña */
    }
    if (hotel) this.config = { apiUrl: hotel.apiUrl };
    else {
      this.config = { apiUrl: environment.apiUrl };
      this.loadConfig();
    }
    return this.config.apiUrl !== before;
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
