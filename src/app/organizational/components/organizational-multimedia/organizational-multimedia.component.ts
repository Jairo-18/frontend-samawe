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
import { TranslateModule } from '@ngx-translate/core';
import { TranslatedPipe } from '../../../shared/pipes/translated.pipe';
import {
  PORTRAIT_MEDIA,
  VIDEO_MEDIA,
  WIDE_MEDIA,
  aspectForMedia
} from '../../../shared/constants/media.constants';

@Component({
  selector: 'app-organizational-multimedia',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    TranslateModule,
    TranslatedPipe
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

  /** Ocupa dos columnas: en el sitio se ve a todo lo ancho. */
  isWide(code: string): boolean {
    return WIDE_MEDIA.has(code);
  }

  /** Se ve en vertical (los fondos de acceso, junto al formulario). */
  isPortrait(code: string): boolean {
    return PORTRAIT_MEDIA.has(code);
  }

  /** El vídeo de portada necesita `<video>`, no `<img>`. */
  isVideo(code: string): boolean {
    return VIDEO_MEDIA.has(code);
  }

  /**
   * Proporción del recuadro, como valor CSS.
   *
   * No se usa una clase `aspect-[...]` construida al vuelo: Tailwind analiza
   * las plantillas en compilación y no vería una clase formada en tiempo de
   * ejecución, así que no acabaría en el CSS.
   */
  aspectFor(code: string): string {
    return aspectForMedia(code);
  }

  /** Qué acepta el selector de archivos de cada ranura. */
  acceptFor(code: string): string {
    return this.isVideo(code) ? 'video/mp4,video/webm' : 'image/*';
  }

  /** Medida recomendada, para que no haya que adivinarla. */
  specFor(code: string): string {
    if (this.isVideo(code)) return 'MP4/WEBM · 1920×1080 · máx. 10 MB';
    if (this.isPortrait(code)) return 'JPG/WEBP · 1080×1440 PX (vertical)';
    return this.isWide(code)
      ? 'JPG/WEBP · 1920×1080 PX'
      : 'JPG/WEBP · 1200×800 PX';
  }

  /**
   * Los tipos se ordenan poniendo los anchos primero.
   *
   * Sin esto la rejilla queda con huecos: una tarjeta de dos columnas no entra
   * en el espacio que deja una de una, y CSS Grid la empuja a la fila
   * siguiente dejando el vacío a la vista.
   */
  get nonLogoTypes(): MediaType[] {
    return this.mediaTypes
      .filter((t) => t.code !== 'LOGO')
      .sort(
        (a, b) => Number(this.isWide(b.code)) - Number(this.isWide(a.code))
      );
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
