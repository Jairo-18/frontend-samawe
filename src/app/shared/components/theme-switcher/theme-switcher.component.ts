import { Component, inject } from '@angular/core';
import { ThemeService } from '../../services/theme.service';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Interruptor de modo claro / oscuro, al lado del de idioma.
 *
 * Es un `mat-slide-toggle` y no un botón como el de idioma porque son cosas
 * distintas: el idioma ALTERNA entre dos valores del mismo rango (ES ⇄ EN) y
 * el rótulo dice a cuál vas; el tema es un ajuste ENCENDIDO/APAGADO, y ahí un
 * interruptor enseña en qué estado estás sin tener que leer nada.
 */
@Component({
  selector: 'app-theme-switcher',
  standalone: true,
  imports: [
    MatIconModule,
    MatSlideToggleModule,
    MatTooltipModule,
    TranslateModule
  ],
  templateUrl: './theme-switcher.component.html'
})
export class ThemeSwitcherComponent {
  readonly theme = inject(ThemeService);
}
