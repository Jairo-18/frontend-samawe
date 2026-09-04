import {
  Component,
  ElementRef,
  OnInit,
  OnDestroy,
  inject,
  Input,
  PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { AccommodationsService } from '../../../../../service-and-product/services/accommodations.service';
import { MostRequestedAccommodation } from '../../../../../service-and-product/interface/accommodation.interface';
import { ButtonLandingComponent } from '../../../../../shared/components/button-landing/button-landing.component';
import { CapitalizePipe } from '../../../../../shared/pipes/capitalize.pipe';
import { TranslatedPipe } from '../../../../../shared/pipes/translated.pipe';
import { SectionHeaderComponent } from '../../../../../public/components/section-header/section-header.component';
import { LoaderComponent } from '../../../../../shared/components/loader/loader.component';
import { Organizational } from '../../../../../shared/interfaces/organizational.interface';

import { TranslateModule } from '@ngx-translate/core';
import { LangService } from '../../../../../shared/services/lang.service';
import { buildSlug } from '../../../../../shared/utils/slug.util';

@Component({
  selector: 'app-most-requested-section',
  standalone: true,
  imports: [
    CommonModule,
    ButtonLandingComponent,
    CapitalizePipe,
    TranslatedPipe,
    SectionHeaderComponent,
    LoaderComponent,
    TranslateModule
  ],
  templateUrl: './most-requested-section.component.html',
  styleUrls: ['./most-requested-section.component.scss']
})
export class MostRequestedSectionComponent implements OnInit, OnDestroy {
  @Input() org: Organizational | null = null;
  private readonly _accommodationsService: AccommodationsService = inject(
    AccommodationsService
  );
  private readonly _router: Router = inject(Router);
  private readonly _langService: LangService = inject(LangService);
  private readonly _elementRef: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly _platformId = inject(PLATFORM_ID);

  accommodations: MostRequestedAccommodation[] = [];
  isLoading: boolean = true;
  currentIndex: Map<number, number> = new Map();
  visible: Map<number, boolean> = new Map();
  lightboxImage: string | null = null;

  isDragging: boolean = false;
  private _dragStartX: number | null = null;
  private _activeDragAcc: MostRequestedAccommodation | null = null;
  private readonly _swipeThreshold = 50;
  private _mouseUpListener: ((e: MouseEvent) => void) | null = null;

  ngOnInit(): void {
    this._accommodationsService.getMostRequested().subscribe({
      next: (res) => {
        this.accommodations = res.data;
        res.data.forEach((acc) => {
          this.currentIndex.set(acc.accommodationId, 0);
          this.visible.set(acc.accommodationId, true);
        });
        this.isLoading = false;
        // Después de tener los datos: antes no hay tarjetas que observar y el
        // contenedor todavía muestra el loader.
        this._observeVisibility();
      },
      error: () => {
        this.accommodations = [];
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this._removeMouseUpListener();
    this._stopAllRotations();
    this._observer?.disconnect();
  }

  private _changeSlide(
    acc: MostRequestedAccommodation,
    newIndex: number
  ): void {
    this.visible.set(acc.accommodationId, false);
    setTimeout(() => {
      this.currentIndex.set(acc.accommodationId, newIndex);
      this.visible.set(acc.accommodationId, true);
    }, 300);
  }

  private _removeMouseUpListener(): void {
    if (this._mouseUpListener && isPlatformBrowser(this._platformId)) {
      document.removeEventListener('mouseup', this._mouseUpListener);
      this._mouseUpListener = null;
    }
  }

  getImage(acc: MostRequestedAccommodation): string {
    const idx = this.currentIndex.get(acc.accommodationId) ?? 0;
    return acc.images[idx]?.imageUrl ?? 'assets/images/notFound.avif';
  }

  getIndex(acc: MostRequestedAccommodation): number {
    return this.currentIndex.get(acc.accommodationId) ?? 0;
  }

  isVisible(acc: MostRequestedAccommodation): boolean {
    return this.visible.get(acc.accommodationId) ?? true;
  }

  goTo(acc: MostRequestedAccommodation, index: number): void {
    this._changeSlide(acc, index);
  }

  onMouseDown(event: MouseEvent, acc: MostRequestedAccommodation): void {
    this._dragStartX = event.clientX;
    this._activeDragAcc = acc;

    this._mouseUpListener = (e: MouseEvent) => {
      this._handleDragEnd(e.clientX);
      this._removeMouseUpListener();
    };
    if (isPlatformBrowser(this._platformId)) {
      document.addEventListener('mouseup', this._mouseUpListener);
    }
  }

  onTouchStart(event: TouchEvent): void {
    this._dragStartX = event.touches[0].clientX;
  }

  onTouchEnd(event: TouchEvent, acc: MostRequestedAccommodation): void {
    this._activeDragAcc = acc;
    this._handleDragEnd(event.changedTouches[0].clientX);
  }

  private _handleDragEnd(endX: number): void {
    if (this._dragStartX === null || !this._activeDragAcc) return;
    const acc = this._activeDragAcc;
    const delta = this._dragStartX - endX;
    this._dragStartX = null;
    this._activeDragAcc = null;

    if (acc.images.length <= 1 || Math.abs(delta) < this._swipeThreshold)
      return;

    const total = acc.images.length;
    const current = this.currentIndex.get(acc.accommodationId) ?? 0;

    this._changeSlide(
      acc,
      delta > 0 ? (current + 1) % total : (current - 1 + total) % total
    );
  }

  openLightbox(imageUrl: string): void {
    this.lightboxImage = imageUrl;
  }

  closeLightbox(): void {
    this.lightboxImage = null;
  }

  /**
   * Va a la ficha del hospedaje, no al listado. Antes mandaba a
   * `/accommodation` sin prefijo de idioma, que además rebota por la tabla de
   * redirecciones en vez de resolver directo.
   */
  navigateToDetail(acc: MostRequestedAccommodation): void {
    this._router.navigateByUrl(this.detailRoute(acc));
  }

  detailRoute(acc: MostRequestedAccommodation): string {
    const lang = this._langService.lang();
    const name = acc.name;
    const label =
      (typeof name === 'string'
        ? name
        : (name?.[lang] ?? name?.['es'] ?? Object.values(name ?? {})[0])) ?? '';
    return this._langService.route(
      `accommodation/${buildSlug(acc.accommodationId, label)}`
    );
  }

  // ── Rotación automática ───────────────────────────────────────────────────
  // Aquí sí van solas, al revés que en la cuadrícula del listado: son dos
  // tarjetas grandes y destacadas, no diez compitiendo por la atención.
  // Con tres frenos: no corre si la sección no está en pantalla, se pausa al
  // pasar el cursor —que es lo que te deja mirar una foto concreta y, de paso,
  // cumple la WCAG 2.2.2 de poder detener el movimiento— y no arranca si el
  // sistema pide menos animación.
  private _rotateTimers = new Map<number, ReturnType<typeof setInterval>>();
  private _startDelays = new Map<number, ReturnType<typeof setTimeout>>();
  private _preloaded = new Set<number>();
  private _observer?: IntersectionObserver;
  private _isSectionVisible = false;
  private _isHovering = false;
  private readonly _rotateEveryMs = 2200;
  /** Desfase entre tarjetas para que no cambien las dos en el mismo instante. */
  private readonly _staggerMs = 700;

  private get _prefersReducedMotion(): boolean {
    if (!isPlatformBrowser(this._platformId)) return true;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private get _canHover(): boolean {
    if (!isPlatformBrowser(this._platformId)) return false;
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }

  /**
   * Arranca cuando la sección entra en pantalla. Sin esto los intervalos
   * correrían desde que carga la portada aunque el visitante esté leyendo
   * cualquier otra parte de la página.
   */
  private _observeVisibility(): void {
    if (!isPlatformBrowser(this._platformId) || this._prefersReducedMotion) {
      return;
    }
    this._observer = new IntersectionObserver(
      (entries) => {
        this._isSectionVisible = entries.some((e) => e.isIntersecting);
        if (this._isSectionVisible) this._startAutoRotation();
        else this._stopAllRotations();
      },
      { threshold: 0.25 }
    );
    this._observer.observe(this._elementRef.nativeElement);
  }

  private _startAutoRotation(): void {
    if (this._prefersReducedMotion || this._isHovering) return;
    this._stopAllRotations();
    this.accommodations.forEach((acc, index) => {
      if ((acc.images?.length ?? 0) <= 1) return;
      this._preloadImages(acc);
      const delay = setTimeout(() => {
        const timer = setInterval(() => {
          if (this.isDragging) return;
          const total = acc.images.length;
          const current = this.currentIndex.get(acc.accommodationId) ?? 0;
          this._changeSlide(acc, (current + 1) % total);
        }, this._rotateEveryMs);
        this._rotateTimers.set(acc.accommodationId, timer);
      }, index * this._staggerMs);
      this._startDelays.set(acc.accommodationId, delay);
    });
  }

  /** El cursor encima pausa: es lo que permite quedarse mirando una foto. */
  onHoverStart(_acc: MostRequestedAccommodation): void {
    if (!this._canHover) return;
    this._isHovering = true;
    this._stopAllRotations();
  }

  onHoverEnd(_acc: MostRequestedAccommodation): void {
    if (!this._canHover) return;
    this._isHovering = false;
    if (this._isSectionVisible) this._startAutoRotation();
  }

  /** Un solo `<img>` con el `src` cambiante: sin precarga, la primera vuelta
   *  pide cada foto a la red y deja el hueco en blanco un instante. */
  private _preloadImages(acc: MostRequestedAccommodation): void {
    if (
      this._preloaded.has(acc.accommodationId) ||
      !isPlatformBrowser(this._platformId)
    ) {
      return;
    }
    this._preloaded.add(acc.accommodationId);
    for (const img of acc.images ?? []) {
      if (!img.imageUrl) continue;
      const preload = new Image();
      preload.src = img.imageUrl;
    }
  }

  private _stopAllRotations(): void {
    // También los `setTimeout` del desfase: si se para justo entre el arranque
    // escalonado y el primer tick, quedaría un intervalo huérfano corriendo.
    for (const delay of this._startDelays.values()) clearTimeout(delay);
    this._startDelays.clear();
    for (const timer of this._rotateTimers.values()) clearInterval(timer);
    this._rotateTimers.clear();
  }
}
