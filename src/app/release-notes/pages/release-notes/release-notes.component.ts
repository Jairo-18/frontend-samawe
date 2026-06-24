import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { LangService } from '../../../shared/services/lang.service';
import {
  RELEASE_NOTES,
  ReleaseSection
} from '../../constants/release-notes.constants';

/**
 * Vista "Notas de versión": muestra, en lenguaje de usuario, todo lo nuevo de la
 * app (facturación electrónica, notas crédito, factura del propietario, etc.) y
 * cómo se usa cada cosa. El contenido es bilingüe (es/en) y se elige según el
 * idioma activo (LangService). Es de solo lectura; no consulta al backend.
 */
@Component({
  selector: 'app-release-notes',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule],
  templateUrl: './release-notes.component.html',
  styleUrl: './release-notes.component.scss'
})
export class ReleaseNotesComponent {
  private readonly _lang = inject(LangService);

  /** Secciones del changelog en el idioma activo (reactivo al cambio de idioma). */
  readonly sections = computed<ReleaseSection[]>(() => {
    const lang = this._lang.lang() === 'en' ? 'en' : 'es';
    return RELEASE_NOTES[lang];
  });
}
