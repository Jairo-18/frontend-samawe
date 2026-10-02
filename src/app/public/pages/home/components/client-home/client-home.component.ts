import {
  Component,
  Input,
  OnInit,
  PLATFORM_ID,
  inject
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';

import { Organizational } from '../../../../../shared/interfaces/organizational.interface';
import { LocalStorageService } from '../../../../../shared/services/localStorage.service';
import { LangService } from '../../../../../shared/services/lang.service';
import { CapitalizePipe } from '../../../../../shared/pipes/capitalize.pipe';
import { MyInvoicesSectionComponent } from '../../../../../user/components/my-invoices-section/my-invoices-section.component';
import { UsersService } from '../../../../../organizational/services/users.service';

interface Tile {
  icon: string;
  titleKey: string;
  descKey: string;
  /** Ruta de la app (se le antepone el idioma). */
  route?: string;
  /** Parámetros de consulta de la ruta (p. ej. la pestaña del perfil). */
  query?: Record<string, string>;
  /** Ancla dentro de esta misma página. */
  anchor?: string;
  action?: () => void;
}

/**
 * Inicio del cliente con sesión (rol USER). Reemplaza la portada de captación:
 * quien ya tiene cuenta no necesita que le vendan el hotel, necesita llegar a
 * lo suyo —sus estadías, sus pedidos, su perfil— y a lo que quiera hacer hoy.
 *
 * El nombre del hotel sale de la organización y no está escrito en las
 * traducciones: así "Tus estadías en Eco Hotel Samawé" sigue bien si cambia la
 * razón social o se reutiliza con otra organización.
 */
@Component({
  selector: 'app-client-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatIconModule,
    TranslateModule,
    CapitalizePipe,
    MyInvoicesSectionComponent
  ],
  templateUrl: './client-home.component.html',
  styleUrl: './client-home.component.scss'
})
export class ClientHomeComponent implements OnInit {
  @Input() org: Organizational | null = null;

  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _translate = inject(TranslateService);
  private readonly _router = inject(Router);
  private readonly _localStorage = inject(LocalStorageService);
  private readonly _usersService = inject(UsersService);
  readonly langService = inject(LangService);

  firstName = '';
  greetingKey = 'home.greeting.hello';


  readonly tiles: Tile[] = [
    {
      icon: 'hotel',
      titleKey: 'public.client_home.tiles.stays_title',
      descKey: 'public.client_home.tiles.stays_desc',
      anchor: 'stays'
    },
    {
      icon: 'receipt_long',
      titleKey: 'public.client_home.tiles.orders_title',
      descKey: 'public.client_home.tiles.orders_desc',
      anchor: 'orders'
    },
    {
      icon: 'restaurant_menu',
      titleKey: 'public.client_home.tiles.menu_title',
      descKey: 'public.client_home.tiles.menu_desc',
      route: 'gastronomy'
    },
    {
      icon: 'bed',
      titleKey: 'public.client_home.tiles.lodging_title',
      descKey: 'public.client_home.tiles.lodging_desc',
      route: 'accommodation'
    },
    {
      icon: 'rate_review',
      titleKey: 'public.client_home.tiles.review_title',
      descKey: 'public.client_home.tiles.review_desc',
      route: 'blog'
    },
    {
      icon: 'person',
      titleKey: 'public.client_home.tiles.profile_title',
      descKey: 'public.client_home.tiles.profile_desc',
      route: 'user/profile'
    },
    {
      icon: 'lock_reset',
      titleKey: 'public.client_home.tiles.password_title',
      descKey: 'public.client_home.tiles.password_desc',
      route: 'user/profile',
      query: { tab: 'password' }
    }
  ];

  get hotelName(): string {
    return this.org?.name ?? '';
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this._platformId)) return;

    this._resolveGreeting();

    // Desde "Mi perfil" se llega con #stays / #orders. La portada se conserva
    // viva entre navegaciones (CacheRouteReuseStrategy), así que no basta con
    // mirar el fragmento al crearla: se escucha cada navegación.
    this._router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this._scrollToFragment());

    const userId = this._localStorage.getUserData()?.userId;
    if (userId) {
      this._usersService.getUserEditPanel(userId).subscribe({
        next: (res) => {
          this.firstName = res.data?.firstName ?? '';
        }
      });
    }

  }

  route(path: string): string {
    return this.langService.route(path);
  }

  scrollTo(anchor: string): void {
    if (!isPlatformBrowser(this._platformId)) return;
    document
      .getElementById(anchor)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  onTile(tile: Tile): void {
    if (tile.anchor) this.scrollTo(tile.anchor);
    else tile.action?.();
  }

  /** Si la URL trae #ancla y la sección ya existe, baja hasta ella. */
  private _scrollToFragment(): void {
    const fragment = this._router.parseUrl(this._router.url).fragment;
    if (!fragment) return;
    // Un tick: tras cargar, el *ngIf de la sección aún no se ha pintado.
    setTimeout(() => this.scrollTo(fragment));
  }

  private _resolveGreeting(): void {
    const hour = new Date().getHours();
    this.greetingKey =
      hour < 12
        ? 'home.greeting.morning'
        : hour < 19
          ? 'home.greeting.afternoon'
          : 'home.greeting.evening';
  }
}
