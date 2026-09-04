import {
  Component,
  OnDestroy,
  PLATFORM_ID,
  inject,
  OnInit
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';

import { AccommodationsService } from '../../../service-and-product/services/accommodations.service';
import { PublicAccommodationDetail } from '../../../service-and-product/interface/accommodation.interface';
import { ApplicationService } from '../../../organizational/services/application.service';
import { Organizational } from '../../../shared/interfaces/organizational.interface';
import { SeoService } from '../../../shared/services/seo.service';
import { LangService } from '../../../shared/services/lang.service';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { ButtonLandingComponent } from '../../../shared/components/button-landing/button-landing.component';
import { TranslatedPipe } from '../../../shared/pipes/translated.pipe';
import { CapitalizePipe } from '../../../shared/pipes/capitalize.pipe';
import { buildSlug, idFromSlug } from '../../../shared/utils/slug.util';
import {
  AvailabilityCalendarComponent,
  SelectedStay
} from '../../components/availability-calendar/availability-calendar.component';

@Component({
  selector: 'app-accommodation-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatIconModule,
    TranslateModule,
    LoaderComponent,
    ButtonLandingComponent,
    TranslatedPipe,
    CapitalizePipe,
    AvailabilityCalendarComponent
  ],
  templateUrl: './accommodation-detail.component.html'
})
export class AccommodationDetailComponent implements OnInit, OnDestroy {
  private readonly _accommodationsService = inject(AccommodationsService);
  private readonly _applicationService = inject(ApplicationService);
  private readonly _seoService = inject(SeoService);
  private readonly _translateService = inject(TranslateService);
  private readonly _route = inject(ActivatedRoute);
  private readonly _router = inject(Router);
  private readonly _platformId = inject(PLATFORM_ID);
  readonly langService = inject(LangService);

  private readonly _subscription = new Subscription();

  org: Organizational | null = null;
  accommodation: PublicAccommodationDetail | null = null;
  loading = true;
  notFound = false;

  /** Índice de la foto grande. Las miniaturas solo cambian este número. */
  currentImageIndex = 0;

  /** Estancia elegida en el calendario, si ya tiene entrada y salida. */
  stay: SelectedStay | null = null;

  onStayChange(stay: SelectedStay | null): void {
    this.stay = stay;
  }

  ngOnInit(): void {
    this._subscription.add(
      this._applicationService.currentOrg$.subscribe((org) => {
        if (org) this.org = org;
      })
    );

    // Se escucha el parámetro en vez de leerlo una vez: navegar de una ficha a
    // otra reutiliza el componente y con el snapshot se quedaría la primera.
    this._subscription.add(
      this._route.paramMap.subscribe((params) => {
        const id = idFromSlug(params.get('slug'));
        if (id === null) {
          this._goToList();
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
    this.currentImageIndex = 0;
    this.mainImageRatio = null;

    this._accommodationsService.getPublicAccommodationDetail(id).subscribe({
      next: (res) => {
        this.accommodation = res.data;
        this.loading = false;
        this._applySeo();
        this._normalizeUrl();
      },
      error: () => {
        // Un id que no existe no puede quedar en blanco: sería un soft 404 y
        // Google ya penalizó este sitio por eso con /cabanas y /camping.
        this.accommodation = null;
        this.notFound = true;
        this.loading = false;
      }
    });
  }

  /**
   * Si entraron con el id pelado o con un slug viejo, se reescribe la URL a la
   * forma canónica sin recargar ni añadir una entrada al historial. El
   * `SeoService` recalcula canonical y hreflang en cada NavigationEnd.
   */
  private _normalizeUrl(): void {
    if (!this.accommodation || !isPlatformBrowser(this._platformId)) return;
    const expected = buildSlug(
      this.accommodation.accommodationId,
      this._name()
    );
    if (this._route.snapshot.paramMap.get('slug') === expected) return;
    this._router.navigate(['../', expected], {
      relativeTo: this._route,
      replaceUrl: true
    });
  }

  private _applySeo(): void {
    if (!this.accommodation) return;
    const description =
      this.accommodation.description ??
      this.org?.accommodationsDescription ??
      undefined;
    this._seoService.updatePage(this.accommodation.name, description);
  }

  private _name(): string {
    const lang = this.langService.lang();
    const name = this.accommodation?.name;
    if (!name) return '';
    return name[lang] ?? name['es'] ?? Object.values(name)[0] ?? '';
  }

  private _goToList(): void {
    this._router.navigateByUrl(this.langService.route('accommodation'));
  }

  get images(): { imageUrl: string }[] {
    const list = (this.accommodation?.images ?? []).filter((i) => !!i.imageUrl);
    return list.length ? list : [{ imageUrl: 'assets/images/notFound.avif' }];
  }

  get mainImage(): string {
    return (
      this.images[this.currentImageIndex]?.imageUrl ?? this.images[0].imageUrl
    );
  }

  /**
   * Proporción de la caja de la galería, tomada de la foto que se está viendo.
   *
   * Con una proporción fija, cualquier foto que no coincidiera exactamente
   * dejaba franjas de fondo desenfocado: las cajas eran 4/3 en móvil y 16/10 en
   * escritorio, así que una foto 4:3 llenaba en el móvil y en escritorio no.
   * `null` mientras no se sabe (SSR, o antes de cargar): ahí mandan las clases.
   */
  mainImageRatio: number | null = null;

  onMainImageLoad(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (!img.naturalWidth || !img.naturalHeight) return;
    const raw = img.naturalWidth / img.naturalHeight;
    // Acotada entre vertical 3:4 y panorámica 16:9: sin tope, una foto muy
    // alta ocuparía toda la pantalla de alto y empujaría el resto de la ficha.
    this.mainImageRatio = Math.min(Math.max(raw, 3 / 4), 16 / 9);
  }

  selectImage(index: number): void {
    this.currentImageIndex = index;
    // La foto nueva puede tener otra forma: se olvida la anterior para no
    // encajarla en una caja que no le corresponde mientras carga.
    this.mainImageRatio = null;
  }

  get listRoute(): string {
    return this.langService.route('accommodation');
  }

  /**
   * Solicitud de reserva por WhatsApp con el hospedaje y las personas ya
   * escritos. Es el paso 1 acordado: todavía no hay reserva transaccional, así
   * que se abre la conversación en vez de fingir un flujo que no existe.
   */
  requestBooking(): void {
    if (!isPlatformBrowser(this._platformId)) return;
    const phone = (this.org?.phone ?? '').replace(/\D/g, '');
    if (!phone) return;

    // Con fechas elegidas el mensaje las lleva; sin ellas se pregunta en
    // abierto. Se formatean con el locale del navegador, que es lo que el
    // huésped acaba de ver en el calendario.
    const key = this.stay
      ? 'public.accommodation_detail.whatsapp_message_dates'
      : 'public.accommodation_detail.whatsapp_message';
    const message = this._translateService.instant(key, {
      name: this._name(),
      checkIn: this.stay?.startDate.toLocaleDateString() ?? '',
      checkOut: this.stay?.endDate.toLocaleDateString() ?? '',
      nights: this.stay?.nights ?? 0
    });
    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      '_blank'
    );
  }

  get canRequestBooking(): boolean {
    return !!(this.org?.phone ?? '').replace(/\D/g, '');
  }
}
