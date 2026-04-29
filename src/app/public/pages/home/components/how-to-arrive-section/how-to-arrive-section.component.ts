import {
  Component,
  Input,
  OnChanges,
  PLATFORM_ID,
  SimpleChanges,
  inject
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { GoogleMap, MapAdvancedMarker } from '@angular/google-maps';
import { Organizational } from '../../../../../shared/interfaces/organizational.interface';
import { ButtonLandingComponent } from '../../../../../shared/components/button-landing/button-landing.component';
import { GoogleMapsStateService } from '../../../../../shared/services/google-maps-state.service';
import { SectionHeaderComponent } from '../../../../../public/components/section-header/section-header.component';
import { TranslatedPipe } from '../../../../../shared/pipes/translated.pipe';

const FALLBACK: google.maps.LatLngLiteral = { lat: 1.2143926, lng: -76.663683 };

@Component({
  selector: 'app-how-to-arrive-section',
  standalone: true,
  imports: [
    GoogleMap,
    MapAdvancedMarker,
    ButtonLandingComponent,
    SectionHeaderComponent,
    TranslatedPipe
  ],
  templateUrl: './how-to-arrive-section.component.html',
  styleUrls: ['./how-to-arrive-section.component.scss']
})
export class HowToArriveSectionComponent implements OnChanges {
  @Input() org: Organizational | null = null;

  private readonly _mapsState: GoogleMapsStateService = inject(
    GoogleMapsStateService
  );
  private readonly _platformId = inject(PLATFORM_ID);

  mapCenter: google.maps.LatLngLiteral = FALLBACK;
  mapOptions: google.maps.MapOptions = { mapId: 'DEMO_MAP_ID' };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['org'] && this.org) {
      if (this._mapsState.coords) {
        this.mapCenter = this._mapsState.coords;
      } else {
        this.mapCenter = this._extractCoords() ?? FALLBACK;
        this._mapsState.coords = this.mapCenter;
      }
    }
  }

  private _extractCoords(): google.maps.LatLngLiteral | null {
    const url = this.org?.mapsUrl ?? '';

    const placeMatch = url.match(/3d(-?\d+\.?\d+)!4d(-?\d+\.?\d+)/);
    if (placeMatch) {
      return { lat: parseFloat(placeMatch[1]), lng: parseFloat(placeMatch[2]) };
    }

    const centerMatch = url.match(/@(-?\d+\.?\d+),(-?\d+\.?\d+)/);
    if (centerMatch) {
      return {
        lat: parseFloat(centerMatch[1]),
        lng: parseFloat(centerMatch[2])
      };
    }

    return null;
  }

  openMaps(): void {
    if (this.org?.mapsUrl && isPlatformBrowser(this._platformId)) {
      window.open(this.org.mapsUrl, '_blank', 'noopener,noreferrer');
    }
  }
}
