import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-section-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './section-header.component.html',
  styleUrl: './section-header.component.scss'
})
export class SectionHeaderComponent {
  @Input() label?: string = '';
  @Input() title?: string = '';
  @Input() description?: string;
  @Input() variant: 'centered' | 'left' = 'centered';

  /**
   * Nivel del encabezado.
   *
   * Por defecto `h2`, que es lo correcto cuando este componente rotula una
   * SECCIÓN dentro de una página que ya tiene su `h1`. Se pone `h1` cuando es
   * el título principal de la página —el caso del blog, que no tenía ninguno—.
   * El aspecto no cambia: el tamaño lo dan las clases, no la etiqueta.
   */
  @Input() headingLevel: 'h1' | 'h2' = 'h2';
}
