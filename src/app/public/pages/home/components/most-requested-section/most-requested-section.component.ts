import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AccommodationsService } from '../../../../../service-and-product/services/accommodations.service';
import { MostRequestedAccommodation } from '../../../../../service-and-product/interface/accommodation.interface';
import { ButtonLandingComponent } from '../../../../../shared/components/button-landing/button-landing.component';

@Component({
  selector: 'app-most-requested-section',
  standalone: true,
  imports: [CommonModule, ButtonLandingComponent],
  templateUrl: './most-requested-section.component.html',
  styleUrls: ['./most-requested-section.component.scss']
})
export class MostRequestedSectionComponent implements OnInit, OnDestroy {
  private readonly _accommodationsService: AccommodationsService = inject(
    AccommodationsService
  );
  private readonly _router: Router = inject(Router);

  accommodations: MostRequestedAccommodation[] = [];
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
      },
      error: () => {
        this.accommodations = [];
      }
    });
  }

  ngOnDestroy(): void {
    this._removeMouseUpListener();
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
    if (this._mouseUpListener) {
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
    document.addEventListener('mouseup', this._mouseUpListener);
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

  navigate(): void {
    this._router.navigate(['/accommodation']);
  }
}
