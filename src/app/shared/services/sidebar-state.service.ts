import { Injectable } from '@angular/core';

/**
 * Servicio singleton que persiste el estado colapsado/expandido del sidebar
 * entre distintas instancias del DefaultLayoutComponent.
 *
 * El problema: navegar a /home hace un redirect a /es o /en, lo cual monta
 * una instancia DIFERENTE del DefaultLayoutComponent. Al destruirse la
 * instancia anterior el estado local del sidebar (isCollapsed) se perdía.
 */
@Injectable({ providedIn: 'root' })
export class SidebarStateService {
  /** true = colapsado (icono pequeño), false = expandido */
  private _isCollapsed: boolean = true;

  get isCollapsed(): boolean {
    return this._isCollapsed;
  }

  set isCollapsed(value: boolean) {
    this._isCollapsed = value;
  }
}
