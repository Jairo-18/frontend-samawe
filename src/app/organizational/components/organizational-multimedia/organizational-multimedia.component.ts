import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  OrganizationalMedia,
  MediaType
} from '../../../shared/interfaces/organizational.interface';

@Component({
  selector: 'app-organizational-multimedia',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './organizational-multimedia.component.html',
  styleUrls: ['./organizational-multimedia.component.scss']
})
export class OrganizationalMultimediaComponent implements OnChanges {
  private readonly _platformId = inject(PLATFORM_ID);

  @Input() mediaMap: Record<
    string,
    OrganizationalMedia | OrganizationalMedia[]
  > = {};
  @Input() mediaTypes: MediaType[] = [];
  @Input() mediaLoading: Record<string, boolean> = {};
  @Input() organizationalId: string | null = null;
  @Output() fileSelected = new EventEmitter<{ event: Event; code: string }>();
  @Output() deleteMedia = new EventEmitter<string>();
  @Output() previewMedia = new EventEmitter<string>();

  loadedImages = new Set<string>();

  get nonLogoTypes(): MediaType[] {
    return this.mediaTypes.filter((t) => t.code !== 'LOGO');
  }

  getMediaUrl(code: string): string | null {
    const media = this.mediaMap[code];
    if (!media) return null;
    return Array.isArray(media) ? media[0]?.url : media.url;
  }

  onImgLoad(code: string): void {
    this.loadedImages.add(code);
  }

  isImageLoaded(code: string): boolean {
    return this.loadedImages.has(code);
  }

  private retried = new Set<string>();

  onImgError(event: Event, code: string): void {
    const img = event.target as HTMLImageElement;
    if (this.retried.has(code)) {
      img.src = 'assets/images/notFound.avif';
      return;
    }
    this.retried.add(code);
    const base = img.src.split('?')[0];
    img.src = `${base}?_r=${Date.now()}`;
  }

  ngOnChanges(): void {
    this.retried = new Set<string>();
    this.loadedImages = new Set<string>();
  }

  triggerInput(code: string): void {
    if (!isPlatformBrowser(this._platformId)) return;
    const input = document.getElementById(`input-${code}`) as HTMLInputElement;
    input?.click();
  }
}
