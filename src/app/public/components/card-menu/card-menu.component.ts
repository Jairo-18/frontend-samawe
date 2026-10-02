import { Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LangService } from '../../../shared/services/lang.service';
import { buildSlug } from '../../../shared/utils/slug.util';
import { AuthService } from '../../../auth/services/auth.service';
import { ButtonLandingComponent } from '../../../shared/components/button-landing/button-landing.component';
import { CommonModule } from '@angular/common';
import { MenuPublicListItem } from '../../../menus/interfaces/menu.interface';
import { CapitalizePipe } from '../../../shared/pipes/capitalize.pipe';
import { TranslatedPipe } from '../../../shared/pipes/translated.pipe';

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-card-menu',
  standalone: true,
  imports: [CommonModule, ButtonLandingComponent, CapitalizePipe, TranslatedPipe, TranslateModule],
  templateUrl: './card-menu.component.html',
  styleUrl: './card-menu.component.scss'
})
export class CardMenuComponent {
  @Input() menu!: MenuPublicListItem;

  private readonly _router = inject(Router);
  private readonly _langService = inject(LangService);
  private readonly _authService = inject(AuthService);

  /** Precios solo con sesión iniciada; la vista pública no los muestra. */
  get showPrices(): boolean {
    return this._authService.isLogged;
  }

  openMenu(): void {
    const lang = this._langService.lang();
    const name = this.menu.name?.[lang] ?? this.menu.name?.['es'] ?? '';
    this._router.navigateByUrl(
      this._langService.route(`gastronomy/menu/${buildSlug(this.menu.menuId, name)}`)
    );
  }

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
