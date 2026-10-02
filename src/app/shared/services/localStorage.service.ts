import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LoginSuccessInterface } from '../../auth/interfaces/login.interface';
@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  private readonly _platformId = inject(PLATFORM_ID);
  private get isBrowser(): boolean {
    return isPlatformBrowser(this._platformId);
  }
  private isLocalStorageAvailable(): boolean {
    if (!this.isBrowser) return false;
    try {
      const testKey = '__test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }
  getUserData() {
    if (!this.isBrowser) return null;
    const allData = localStorage.getItem('_sessionData');
    if (allData) {
      try {
        const parsedData = JSON.parse(allData);
        return parsedData?.user || null;
      } catch (_e) {
        return null;
      }
    }
    return null;
  }
  getAllSessionData(): LoginSuccessInterface {
    if (!this.isBrowser) return null as unknown as LoginSuccessInterface;
    const allData = localStorage.getItem('_sessionData');
    const parsedData = allData && JSON.parse(allData);
    return parsedData;
  }
  /**
   * Preferencias del DISPOSITIVO, no de la sesión: sobreviven al cierre de
   * sesión. Antes solo se salvaba el idioma, y `clear()` se llevaba también
   * `_cookieConsent`: cada vez que se cerraba sesión (o caducaba) el aviso de
   * cookies volvía a salir.
   */
  private static readonly _DEVICE_KEYS = ['lang', '_cookieConsent'];

  cleanLocalStorage(): void {
    if (!this.isLocalStorageAvailable()) return;
    const kept = LocalStorageService._DEVICE_KEYS.map(
      (key) => [key, localStorage.getItem(key)] as const
    );
    localStorage.clear();
    kept.forEach(([key, value]) => {
      if (value !== null) localStorage.setItem(key, value);
    });
  }
  getItem(key: string) {
    if (!this.isLocalStorageAvailable()) return null;
    return localStorage.getItem(key);
  }
  setItem(key: string, value: string): void {
    if (!this.isLocalStorageAvailable()) return;
    localStorage.setItem(key, value);
  }
  removeItem(key: string): void {
    if (!this.isLocalStorageAvailable()) return;
    localStorage.removeItem(key);
  }
  getAccessToken(): string {
    return this.getAllSessionData()?.tokens?.accessToken || '';
  }
  setRedirectUrl(url: string): void {
    if (!this.isBrowser) return;
    localStorage.setItem('redirectUrl', url);
  }
  getRedirectUrl(): string {
    if (!this.isBrowser) return '';
    return localStorage.getItem('redirectUrl') || '';
  }
  cleanRedirectUrl(): void {
    if (!this.isBrowser) return;
    localStorage.removeItem('redirectUrl');
  }
}
