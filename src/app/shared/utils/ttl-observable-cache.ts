import { Observable, catchError, shareReplay, tap, throwError } from 'rxjs';

interface Entry {
  obs$: Observable<unknown>;
  expiresAt: number;
}

/**
 * Caché en memoria de lecturas HTTP, con vencimiento.
 *
 * Dos visitas a la misma página pública (o dos componentes que piden lo mismo
 * a la vez) comparten UNA sola petición durante `ttlMs`. Sirve para lo que es
 * igual para todos los visitantes —listados y fichas públicas—; no usar con
 * datos que dependan de la sesión.
 *
 * Una petición que falla no se queda cacheada: si no, un error de red puntual
 * se repetiría hasta que venciera el TTL.
 *
 * `clear()` se llama desde las mutaciones del panel para que quien edita vea su
 * cambio al momento y no tenga que esperar al vencimiento.
 */
export class TtlObservableCache {
  private readonly _entries = new Map<string, Entry>();

  get<T>(key: string, ttlMs: number, factory: () => Observable<T>): Observable<T> {
    const hit = this._entries.get(key);
    if (hit && hit.expiresAt > Date.now()) return hit.obs$ as Observable<T>;

    const obs$ = factory().pipe(
      shareReplay({ bufferSize: 1, refCount: false }),
      catchError((err) => {
        this._entries.delete(key);
        return throwError(() => err);
      })
    );
    this._entries.set(key, { obs$, expiresAt: Date.now() + ttlMs });
    return obs$;
  }

  /** Tras una mutación: pasa el observable por aquí para vaciar la caché. */
  invalidateAfter<T>(source$: Observable<T>): Observable<T> {
    return source$.pipe(tap(() => this.clear()));
  }

  clear(): void {
    this._entries.clear();
  }
}
