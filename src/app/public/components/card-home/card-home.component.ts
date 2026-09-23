import { Component, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  DashboardActionGroup,
  DashboardCard
} from '../../interface/card.interface';
import {
  DASHBOARD_ACTION_GROUPS,
  DASHBOARD_CARDS
} from '../../constants/card.constants';
import { MatIconModule } from '@angular/material/icon';
import { LocalStorageService } from '../../../shared/services/localStorage.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

/**
 * Inicio del personal: la mesa de trabajo al empezar el turno.
 *
 * Dos registros, y la diferencia dice qué hace el clic:
 *
 *  · Lo que se CREA a diario, en fichas compactas agrupadas.
 *  · Las vistas que se CONSULTAN de vez en cuando, como lista discreta.
 *
 * Antes era una sola cuadrícula de tarjetas idénticas: lo que se usa veinte
 * veces al día pesaba lo mismo que lo que se abre una vez al mes, y había que
 * leerlas todas para encontrar una.
 */
@Component({
  selector: 'app-card-home',
  standalone: true,
  imports: [MatIconModule, RouterLink, TranslateModule],
  templateUrl: './card-home.component.html',
  styleUrl: './card-home.component.scss'
})
export class CardHomeComponent {
  actionGroups: DashboardActionGroup[] = [];
  cards: DashboardCard[] = [];

  /** Nombre de pila, para saludar. Vacío si no hay dato: no se inventa nada. */
  firstName = '';
  greetingKey = 'home.greeting.hello';
  today = '';

  private readonly _localStorage = inject(LocalStorageService);
  private readonly _translate = inject(TranslateService);
  private readonly _platformId = inject(PLATFORM_ID);

  constructor() {
    const user = this._localStorage.getUserData();
    const roleCode = user?.roleType?.code ?? '';

    this.firstName = (user?.firstName ?? '').trim().split(' ')[0] ?? '';
    this.resolveGreeting();

    // Un grupo sin acciones permitidas no se pinta: un encabezado suelto sobre
    // nada es peor que no tener la sección.
    this.actionGroups = DASHBOARD_ACTION_GROUPS.map((group) => ({
      ...group,
      actions: group.actions.filter((a) => a.allowedRoles.includes(roleCode))
    })).filter((group) => group.actions.length > 0);

    this.cards = DASHBOARD_CARDS.filter((card) =>
      card.allowedRoles?.includes(roleCode)
    ).map((card) => {
      // El mesero no edita recetas, las consulta para tomar el pedido.
      if (card.title === 'home.cards.recipes.title' && roleCode === 'MES') {
        return {
          ...card,
          description: 'home.cards.recipes.waiter_description'
        };
      }
      return card;
    });
  }

  /**
   * Saludo y fecha según la hora local. En un hotel hay turnos, así que la
   * franja horaria es orientación real, no adorno.
   *
   * Solo en navegador: en SSR la hora sería la del contenedor y el saludo
   * cambiaría al hidratar. (Este bloque no llega a renderizarse en servidor
   * —depende de `localStorage`— pero el guard evita que eso se dé por supuesto.)
   */
  private resolveGreeting(): void {
    if (!isPlatformBrowser(this._platformId)) return;

    const now = new Date();
    const hour = now.getHours();
    this.greetingKey =
      hour < 12
        ? 'home.greeting.morning'
        : hour < 19
          ? 'home.greeting.afternoon'
          : 'home.greeting.evening';

    const locale = this._translate.currentLang === 'en' ? 'en-US' : 'es-CO';
    this.today = now.toLocaleDateString(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  }
}
