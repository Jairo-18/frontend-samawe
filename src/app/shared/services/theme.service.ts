import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark';

/** Clave en `localStorage`. Solo existe si la persona ELIGIÓ manualmente. */
const THEME_KEY = 'theme';

/**
 * Modo claro / oscuro.
 *
 * La regla, en una frase: **manda el sistema operativo hasta que la persona
 * decida otra cosa**; a partir de ahí manda su elección, también en las
 * visitas siguientes.
 *
 * Por eso `localStorage` solo se escribe al pulsar el interruptor. Si se
 * guardara siempre el tema aplicado, la primera visita dejaría grabado el valor
 * del sistema y, si esa persona cambiara su Windows a oscuro más adelante, la
 * aplicación seguiría en claro sin que se entienda por qué.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _document: Document = inject(DOCUMENT);

  private readonly _theme = signal<Theme>('light');
  readonly theme = this._theme.asReadonly();

  get isDark(): boolean {
    return this._theme() === 'dark';
  }

  /** Se llama una vez al arrancar la aplicación. */
  init(): void {
    if (!isPlatformBrowser(this._platformId)) return;

    const stored = localStorage.getItem(THEME_KEY) as Theme | null;
    this._apply(stored ?? (this._systemPrefersDark() ? 'dark' : 'light'));

    // Mientras no haya elección manual, la aplicación sigue al sistema en
    // caliente: si alguien cambia su equipo a oscuro con la pestaña abierta,
    // esto se entera. Con elección guardada, se ignora.
    this._document.defaultView
      ?.matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => {
        if (localStorage.getItem(THEME_KEY)) return;
        this._apply(e.matches ? 'dark' : 'light');
      });
  }

  /** Cambia de modo y recuerda la decisión. */
  toggle(): void {
    if (!isPlatformBrowser(this._platformId)) return;
    const next: Theme = this._theme() === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, next);
    this._apply(next);
  }

  /** Vuelve a seguir al sistema, olvidando la elección manual. */
  followSystem(): void {
    if (!isPlatformBrowser(this._platformId)) return;
    localStorage.removeItem(THEME_KEY);
    this._apply(this._systemPrefersDark() ? 'dark' : 'light');
  }

  private _systemPrefersDark(): boolean {
    return (
      this._document.defaultView?.matchMedia('(prefers-color-scheme: dark)')
        .matches ?? false
    );
  }

  /**
   * El tema viaja como atributo en `<html>`, no como clase, para no chocar con
   * las utilidades de Tailwind ni con las clases que ya se añaden ahí.
   */
  private _apply(theme: Theme): void {
    this._theme.set(theme);
    this._document.documentElement.setAttribute('data-theme', theme);
  }
}
