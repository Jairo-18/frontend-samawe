import { Component, inject, Input, OnDestroy, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PublicAccommodationListItem } from '../../../service-and-product/interface/accommodation.interface';
import { CapitalizePipe } from '../../../shared/pipes/capitalize.pipe';
import { ButtonLandingComponent } from '../../../shared/components/button-landing/button-landing.component';

@Component({
  selector: 'app-card-accommodation',
  standalone: true,
  imports: [CommonModule, CapitalizePipe, ButtonLandingComponent],
  templateUrl: './card-accommodation.component.html',
  styleUrl: './card-accommodation.component.scss'
})
export class CardAccommodationComponent implements OnDestroy {
  private readonly _platformId = inject(PLATFORM_ID);

  @Input() accommodation!: PublicAccommodationListItem;

  currentImageIndex: number = 0;
  visible: boolean = true;
  isDragging: boolean = false;
  readonly maxDescChars: number = 250;

  get shortDescription(): string {
    const desc = this.accommodation?.description ?? '';
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

  ngOnDestroy(): void {
    this._removeMouseUpListener();
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
