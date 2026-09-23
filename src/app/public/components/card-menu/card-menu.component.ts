import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuPublicListItem } from '../../../menus/interfaces/menu.interface';
import { CapitalizePipe } from '../../../shared/pipes/capitalize.pipe';
import { TranslatedPipe } from '../../../shared/pipes/translated.pipe';

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-card-menu',
  standalone: true,
  imports: [CommonModule, CapitalizePipe, TranslatedPipe, TranslateModule],
  templateUrl: './card-menu.component.html',
  styleUrl: './card-menu.component.scss'
})
export class CardMenuComponent {
  @Input() menu!: MenuPublicListItem;

  /** Tope de platillos visibles, UNA fila: con esto la card mide siempre lo
   * mismo, sin importar si el menú tiene 3 platillos o 12. Se topa a una fila
   * (no dos) para que el alto fijo no le sobre aire vacío a los menús —la
   * mayoría— que traen 3. */
  private readonly _maxVisibleDishes = 3;

  get visibleDishes(): MenuPublicListItem['dishes'] {
    return this.menu?.dishes?.slice(0, this._maxVisibleDishes) ?? [];
  }

  get extraDishesCount(): number {
    return Math.max((this.menu?.dishes?.length ?? 0) - this._maxVisibleDishes, 0);
  }

  dishImage(dish: MenuPublicListItem['dishes'][number]): string {
    return dish.images?.[0]?.imageUrl ?? 'assets/images/notFound.avif';
  }
}
