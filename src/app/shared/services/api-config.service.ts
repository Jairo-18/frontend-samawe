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

  /**
   * Carga la configuración del API desde localStorage o desde window
   * Esto permite configurar dinámicamente la URL del backend para tablets
   */
  private loadConfig(): void {
    // 1. Intentar cargar desde localStorage (configuración manual de tablets)
    const savedConfig = localStorage.getItem('api-config');
    if (savedConfig) {
      try {
        this.config = JSON.parse(savedConfig);
        console.log(
          '✅ Configuración cargada desde localStorage:',
          this.config
        );
        return;
      } catch (e) {
        console.error('Error al parsear configuración guardada:', e);
      }
    }

    if ((window as any).__API_CONFIG__) {
      this.config = (window as any).__API_CONFIG__;
      return;
    }
  }

  /**
   * Obtiene la URL base del API
   */
  getApiUrl(): string {
    return this.config.apiUrl;
  }

  /**
   * Configura la URL del API manualmente (útil para tablets)
   * @param apiUrl URL completa del API (ej: http://192.168.1.100:3001/)
   */
  setApiUrl(apiUrl: string): void {
    this.config.apiUrl = apiUrl.endsWith('/') ? apiUrl : `${apiUrl}/`;
    localStorage.setItem('api-config', JSON.stringify(this.config));
    console.log('✅ Configuración actualizada:', this.config);
  }

  /**
   * Verifica si la configuración está usando la IP local por defecto
   */
  isUsingLocalhost(): boolean {
    return (
      this.config.apiUrl.includes('localhost') ||
      this.config.apiUrl.includes('127.0.0.1')
    );
  }

  /**
   * Limpia la configuración guardada y vuelve a la configuración por defecto
   */
  resetConfig(): void {
    localStorage.removeItem('api-config');
    this.config = { apiUrl: environment.apiUrl };
    console.log('✅ Configuración restablecida a valores por defecto');
  }

  /**
   * Obtiene la configuración completa
   */
  getConfig(): ApiConfig {
    return { ...this.config };
  }
}
