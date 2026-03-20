import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebPushService {
  private _swRegistration: ServiceWorkerRegistration | null = null;

  constructor(private readonly _http: HttpClient) {}

  async init(): Promise<void> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('[WebPush] No soportado en este navegador.');
      return;
    }

    try {
      this._swRegistration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('[WebPush] Service Worker registrado.');
    } catch (err) {
      console.error('[WebPush] Error al registrar Service Worker:', err);
    }
  }

  async requestPermissionAndSubscribe(): Promise<void> {
    if (!('Notification' in window)) {
      console.warn('[WebPush] Notificaciones no soportadas.');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[WebPush] Permiso denegado por el usuario.');
      return;
    }

    await this._subscribe();
  }

  private async _subscribe(): Promise<void> {
    if (!this._swRegistration) {
      await this.init();
    }
    if (!this._swRegistration) return;

    try {
      const baseUrl = environment.apiUrl.endsWith('/')
        ? environment.apiUrl.slice(0, -1)
        : environment.apiUrl;

      // Obtener la VAPID public key del backend
      const res = await firstValueFrom(
        this._http.get<{ data: { publicKey: string } }>(
          `${baseUrl}/notifications/push/vapid-key`
        )
      );

      const vapidPublicKey = res.data.publicKey;
      const convertedKey = this._urlBase64ToUint8Array(vapidPublicKey);

      // Verificar si ya hay una suscripción activa
      const existingSub =
        await this._swRegistration.pushManager.getSubscription();
      if (existingSub) {
        // Asegurarse de que esté registrada en el backend también
        await this._sendSubscriptionToServer(existingSub, baseUrl);
        return;
      }

      // Crear nueva suscripción
      const subscription = await this._swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey
      });

      await this._sendSubscriptionToServer(subscription, baseUrl);
      console.log('[WebPush] Suscripción push registrada.');
    } catch (err) {
      console.error('[WebPush] Error al suscribirse:', err);
    }
  }

  private async _sendSubscriptionToServer(
    subscription: PushSubscription,
    baseUrl: string
  ): Promise<void> {
    const sub = subscription.toJSON();
    await firstValueFrom(
      this._http.post(`${baseUrl}/notifications/push/subscribe`, {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.keys?.['p256dh'],
          auth: sub.keys?.['auth']
        }
      })
    );
  }

  async unsubscribe(): Promise<void> {
    if (!this._swRegistration) return;

    const subscription =
      await this._swRegistration.pushManager.getSubscription();
    if (!subscription) return;

    const endpoint = subscription.endpoint;
    const baseUrl = environment.apiUrl.endsWith('/')
      ? environment.apiUrl.slice(0, -1)
      : environment.apiUrl;

    await subscription.unsubscribe();
    await firstValueFrom(
      this._http.delete(`${baseUrl}/notifications/push/unsubscribe`, {
        body: { endpoint }
      })
    );
    console.log('[WebPush] Suscripción cancelada.');
  }

  private _urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}
