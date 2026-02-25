/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
export interface ApiConfig {
  apiUrl: string;
}
@Injectable({
  providedIn: 'root'
})
export class ApiConfigService {
  private config: ApiConfig = {
    apiUrl: environment.apiUrl
  };
  constructor() {
    this.loadConfig();
  }
  private loadConfig(): void {
    const savedConfig = localStorage.getItem('api-config');
    if (savedConfig) {
      try {
        const parsed: ApiConfig = JSON.parse(savedConfig);
        if (this.isSiteSecure() && parsed.apiUrl?.startsWith('http://')) {
          console.warn(
            '⚠️ Se ignoró configuración guardada con http:// porque el sitio usa HTTPS. Limpiando...'
          );
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
  getApiUrl(): string {
    return this.config.apiUrl;
  }
  setApiUrl(apiUrl: string): void {
    let url = apiUrl.endsWith('/') ? apiUrl : `${apiUrl}/`;
    if (this.isSiteSecure() && url.startsWith('http://')) {
      url = url.replace('http://', 'https://');
      console.warn('⚠️ URL convertida a HTTPS automáticamente:', url);
    }
    this.config.apiUrl = url;
    localStorage.setItem('api-config', JSON.stringify(this.config));
  }
  isUsingLocalhost(): boolean {
    return (
      this.config.apiUrl.includes('localhost') ||
      this.config.apiUrl.includes('127.0.0.1')
    );
  }
  resetConfig(): void {
    localStorage.removeItem('api-config');
    this.config = { apiUrl: environment.apiUrl };
  }
  getConfig(): ApiConfig {
    return { ...this.config };
  }
  private isSiteSecure(): boolean {
    return window.location.protocol === 'https:';
  }
}
