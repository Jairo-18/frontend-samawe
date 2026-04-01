import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { OrganizationalMedia, MediaType } from '../../../shared/interfaces/organizational.interface';

interface MediaSection {
  label: string;
  icon: string;
  codes: string[];
}

@Component({
  selector: 'app-organizational-multimedia',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './organizational-multimedia.component.html',
})
export class OrganizationalMultimediaComponent {
  @Input() mediaMap: Record<string, OrganizationalMedia | OrganizationalMedia[]> = {};
  @Input() mediaTypes: MediaType[] = [];
  @Input() mediaLoading: Record<string, boolean> = {};
  @Input() organizationalId: string | null = null;
  @Output() fileSelected = new EventEmitter<{ event: Event; code: string }>();
  @Output() deleteMedia = new EventEmitter<string>();
  @Output() previewMedia = new EventEmitter<string>();

  readonly mediaSections: MediaSection[] = [
    {
      label: 'Autenticación',
      icon: 'lock',
      codes: ['LOGIN_BG', 'REGISTER_BG'],
    },
    {
      label: 'Experiencia de Inicio',
      icon: 'home',
      codes: ['EXPERIENCE_IMAGE'],
    },
    {
      label: 'Sobre Nosotros',
      icon: 'groups',
      codes: ['ABOUT_US_IMAGE', 'MISSION_IMAGE', 'VISION_IMAGE', 'HISTORY_IMAGE'],
    },
    {
      label: 'Gastronomía',
      icon: 'restaurant',
      codes: ['GASTRONOMY_IMAGE', 'GASTRONOMY_HISTORY_IMAGE', 'GASTRONOMY_KITCHEN_IMAGE', 'GASTRONOMY_INGR_IMAGE'],
    },
    {
      label: 'Alojamiento',
      icon: 'hotel',
      codes: ['ACCOMMODATIONS_IMAGE'],
    },
    {
      label: 'Cómo Llegar',
      icon: 'map',
      codes: ['HOW_TO_ARRIVE_IMAGE'],
    },
  ];

  getMediaUrl(code: string): string | null {
    const media = this.mediaMap[code];
    if (!media) return null;
    return Array.isArray(media) ? media[0]?.url : media.url;
  }

  getSectionTypes(codes: string[]): MediaType[] {
    return codes
      .map((code) => this.mediaTypes.find((t) => t.code === code))
      .filter((t): t is MediaType => !!t);
  }

  triggerInput(code: string): void {
    const input = document.getElementById(`input-${code}`) as HTMLInputElement;
    input?.click();
  }
}
