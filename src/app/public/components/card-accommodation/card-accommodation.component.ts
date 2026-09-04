import {
  Component,
  HostListener,
  inject,
  Input,
  OnDestroy,
  PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PublicAccommodationListItem } from '../../../service-and-product/interface/accommodation.interface';
import { CapitalizePipe } from '../../../shared/pipes/capitalize.pipe';
import { ButtonLandingComponent } from '../../../shared/components/button-landing/button-landing.component';
import { TranslatedPipe } from '../../../shared/pipes/translated.pipe';

import { TranslateModule } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';
import { LangService } from '../../../shared/services/lang.service';
import { buildSlug } from '../../../shared/utils/slug.util';

@Component({
  selector: 'app-card-accommodation',
  standalone: true,
  imports: [
    CommonModule,
    CapitalizePipe,
    ButtonLandingComponent,
    TranslatedPipe,
    TranslateModule,
    RouterLink
  ],
  templateUrl: './card-accommodation.component.html',
  styleUrl: './card-accommodation.component.scss'
})
export class CardAccommodationComponent implements OnDestroy {
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _langService = inject(LangService);

  @Input() accommodation!: PublicAccommodationListItem;

  /**
   * Ruta a la ficha, con el idioma actual y el slug legible. Se calcula aquí y
   * no en la plantilla para no rehacer el slug en cada ciclo de detección.
   */
  get detailRoute(): string {
    if (!this.accommodation) return this._langService.route('accommodation');
    const name = this.accommodation.name;
    const lang = this._langService.lang();
    const label =
      (typeof name === 'string'
        ? name
        : (name?.[lang] ?? name?.['es'] ?? Object.values(name ?? {})[0])) ?? '';
    return this._langService.route(
      `accommodation/${buildSlug(this.accommodation.accommodationId, label)}`
    );
  }

  currentImageIndex: number = 0;
  visible: boolean = true;
  isDragging: boolean = false;
  readonly maxDescChars: number = 250;

  get shortDescription(): string {
    const raw = this.accommodation?.description;
    const desc = !raw
      ? ''
      : typeof raw === 'string'
        ? raw
        : (raw['es'] ?? Object.values(raw)[0] ?? '');
    return desc.length > this.maxDescChars
      ? desc.slice(0, this.maxDescChars) + '…'
      : desc;
  }

  private _dragStartX: number | null = null;
  private readonly _swipeThreshold = 50;
  private _mouseUpListener: ((e: MouseEvent) => void) | null = null;

  get validImages() {
    return this.accommodation?.images?.filter((img) => !!img.imageUrl) ?? [];
  }

  get mainImage(): string {
    return (
      this.validImages[this.currentImageIndex]?.imageUrl ??
      'assets/images/notFound.avif'
    );
  }

  get isAvailable(): boolean {
    return this.accommodation?.stateType?.code !== 'MAN';
  }

  // ── Rotación automática al pasar el cursor ────────────────────────────────
  // Solo con el puntero encima, no en toda la cuadrícula a la vez: diez cards
  // moviéndose solas es ruido visual, gasta batería con diez intervalos de
  // fondo y choca con la WCAG 2.2.2 (movimiento automático de más de 5s sin
  // forma de pausarlo). Aquí lo provoca el usuario, así que nada de eso aplica.
  private _rotateTimer?: ReturnType<typeof setInterval>;
  private _preloaded = false;
  private readonly _rotateEveryMs = 2200;

  /**
   * Solo en dispositivos con puntero real. En táctil `mouseenter` se dispara al
   * tocar y el estado queda pegado hasta que tocas otra cosa: la card se
   * quedaría rotando sola. Se pregunta por la capacidad del puntero y no por el
   * ancho, que es lo que falla con tablets y portátiles táctiles.
   */
  private get _canHover(): boolean {
    if (!isPlatformBrowser(this._platformId)) return false;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return false;
    }
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }

  @HostListener('mouseenter')
  onHoverStart(): void {
    if (!this._canHover || this.validImages.length <= 1) return;
    this._preloadImages();
    this._stopRotation();
    this._rotateTimer = setInterval(() => {
      // Mientras se arrastra manda el usuario; si no, el intervalo le pelearía
      // el control al dedo o al ratón.
      if (this.isDragging) return;
      this.changeSlide((this.currentImageIndex + 1) % this.validImages.length);
    }, this._rotateEveryMs);
  }

  @HostListener('mouseleave')
  onHoverEnd(): void {
    this._stopRotation();
  }

  private _stopRotation(): void {
    if (this._rotateTimer) {
      clearInterval(this._rotateTimer);
      this._rotateTimer = undefined;
    }
  }

  /**
   * La plantilla tiene un solo `<img>` cuyo `src` cambia, así que la primera
   * vez que se muestra cada foto hay una petición de red y el hueco queda en
   * blanco un instante. Precargando al primer hover, los cambios salen ya
   * cacheados y el fundido se ve limpio.
   */
  private _preloadImages(): void {
    if (this._preloaded || !isPlatformBrowser(this._platformId)) return;
    this._preloaded = true;
    for (const img of this.validImages) {
      const preload = new Image();
      preload.src = img.imageUrl;
    }
  }

  ngOnDestroy(): void {
    this._removeMouseUpListener();
    this._stopRotation();
  }

  changeSlide(newIndex: number): void {
    this.visible = false;
    setTimeout(() => {
      this.currentImageIndex = newIndex;
      this.visible = true;
    }, 200);
  }

  onMouseDown(event: MouseEvent): void {
    this._dragStartX = event.clientX;
    this.isDragging = true;

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

  onTouchEnd(event: TouchEvent): void {
    this._handleDragEnd(event.changedTouches[0].clientX);
  }

  private _handleDragEnd(endX: number): void {
    this.isDragging = false;
    if (this._dragStartX === null || this.validImages.length <= 1) return;
    const delta = this._dragStartX - endX;
    this._dragStartX = null;
    if (Math.abs(delta) < this._swipeThreshold) return;
    const total = this.validImages.length;
    this.changeSlide(
      delta > 0
        ? (this.currentImageIndex + 1) % total
        : (this.currentImageIndex - 1 + total) % total
    );
  }

  private _removeMouseUpListener(): void {
    if (this._mouseUpListener && isPlatformBrowser(this._platformId)) {
      document.removeEventListener('mouseup', this._mouseUpListener);
      this._mouseUpListener = null;
    }
  }
}
