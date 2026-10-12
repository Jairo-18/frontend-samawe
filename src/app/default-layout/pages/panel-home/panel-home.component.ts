import { Component } from '@angular/core';
import { BasePageComponent } from '../../../shared/components/base-page/base-page.component';
import { CardHomeComponent } from '../../../public/components/card-home/card-home.component';

/**
 * "Inicio" del personal, para TODOS los hoteles: saludo y accesos rápidos.
 *
 * Antes solo existía dentro de la portada pública (`/es`), que es la web de
 * Samawe: el personal de otro hotel no los tenía, y al entrar ahí el panel
 * se cambiaba a la marca de Samawe. Aquí vive en el panel, con la marca del
 * hotel de la sesión.
 */
@Component({
  selector: 'app-panel-home',
  standalone: true,
  imports: [BasePageComponent, CardHomeComponent],
  template: `
    <app-base-page>
      <app-card-home></app-card-home>
    </app-base-page>
  `
})
export class PanelHomeComponent {}
