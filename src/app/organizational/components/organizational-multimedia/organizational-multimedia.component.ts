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

  get nonLogoTypes(): MediaType[] {
    return this.mediaTypes.filter((t) => t.code !== 'LOGO');
  }

  getMediaUrl(code: string): string | null {
    const media = this.mediaMap[code];
    if (!media) return null;
    return Array.isArray(media) ? media[0]?.url : media.url;
  }

  private retryCount: Record<string, number> = {};

  private baseSrc: Record<string, string> = {};

  onImgError(event: Event, code: string): void {
    const img = event.target as HTMLImageElement;
    const failedSrc = img.src;
    if (!this.baseSrc[code]) {
      this.baseSrc[code] = failedSrc.split('?')[0].split('#')[0];
    }
    const base = this.baseSrc[code];
    const count = (this.retryCount[code] ?? 0) + 1;
    this.retryCount[code] = count;

    if (count <= 4) {
      setTimeout(() => {
        if (!img.src.startsWith(base)) {
          this.retryCount[code] = 0;
          return;
        }
        const sep = base.includes('?') ? '&' : '?';
        img.src = `${base}${sep}_r=${Date.now()}`;
      }, 1500 * count);
    } else {
      this.retryCount[code] = 0;
    }
  }

  ngOnChanges(): void {
    this.retryCount = {};
    this.baseSrc = {};
  }

  triggerInput(code: string): void {
    if (!isPlatformBrowser(this._platformId)) return;
    const input = document.getElementById(`input-${code}`) as HTMLInputElement;
    input?.click();
  }
}
