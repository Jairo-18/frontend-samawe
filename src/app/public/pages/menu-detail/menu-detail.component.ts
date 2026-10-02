import { Component, OnDestroy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';

import { MenuService } from '../../../menus/services/menu.service';
import { MenuPublicListItem } from '../../../menus/interfaces/menu.interface';
import { AuthService } from '../../../auth/services/auth.service';
import { SeoService } from '../../../shared/services/seo.service';
import { LangService } from '../../../shared/services/lang.service';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { TranslatedPipe } from '../../../shared/pipes/translated.pipe';
import { CapitalizePipe } from '../../../shared/pipes/capitalize.pipe';
import { buildSlug, idFromSlug } from '../../../shared/utils/slug.util';

@Component({
  selector: 'app-menu-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatIconModule,
    TranslateModule,
    LoaderComponent,
    TranslatedPipe,
    CapitalizePipe
  ],
  templateUrl: './menu-detail.component.html'
})
export class MenuDetailComponent implements OnInit, OnDestroy {
  private readonly _menuService = inject(MenuService);
  private readonly _authService = inject(AuthService);
  private readonly _seoService = inject(SeoService);
  private readonly _route = inject(ActivatedRoute);
  private readonly _router = inject(Router);
  private readonly _platformId = inject(PLATFORM_ID);
  readonly langService = inject(LangService);

  private readonly _subscription = new Subscription();

  menu: MenuPublicListItem | null = null;
  loading = true;
  notFound = false;

  /** Precios solo con sesión iniciada; la vista pública no los muestra. */
  get showPrices(): boolean {
    return this._authService.isLogged;
  }

  get listRoute(): string {
    return this.langService.route('gastronomy');
  }

  ngOnInit(): void {
    // Se escucha el parámetro y no el snapshot: ir de un menú a otro reutiliza
    // el componente.
    this._subscription.add(
      this._route.paramMap.subscribe((params) => {
        const id = idFromSlug(params.get('slug'));
        if (id === null) {
          this._router.navigateByUrl(this.listRoute);
          return;
        }
        this._load(id);
      })
    );
  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }

  private _load(id: number): void {
    this.loading = true;
    this.notFound = false;

    this._menuService.getPublicById(id).subscribe({
      next: (res) => {
        this.menu = res.data;
        this.loading = false;
        this._applySeo();
        this._normalizeUrl();
      },
      error: () => {
        // Estado explícito y no página en blanco: sería un soft 404.
        this.menu = null;
        this.notFound = true;
        this.loading = false;
      }
    });
  }

  /** Reescribe la URL a la forma canónica (`3-desayunos`) sin recargar. */
  private _normalizeUrl(): void {
    if (!this.menu || !isPlatformBrowser(this._platformId)) return;
    const expected = buildSlug(this.menu.menuId, this._name());
    if (this._route.snapshot.paramMap.get('slug') === expected) return;
    this._router.navigate(['../', expected], {
      relativeTo: this._route,
      replaceUrl: true
    });
  }

  private _applySeo(): void {
    if (!this.menu) return;
    const lang = this.langService.lang();
    const place =
      lang === 'en'
        ? 'Menu · Restaurant in Mocoa, Putumayo'
        : 'Carta · Restaurante en Mocoa, Putumayo';
    this._seoService.updatePage(`${this._name()} · ${place}`, this.menu.description);
  }

  private _name(): string {
    const lang = this.langService.lang();
    const name = this.menu?.name;
    if (!name) return '';
    return name[lang] ?? name['es'] ?? Object.values(name)[0] ?? '';
  }

  dishImage(dish: MenuPublicListItem['dishes'][number]): string {
    return dish.images?.[0]?.imageUrl ?? 'assets/images/notFound.avif';
  }
}
