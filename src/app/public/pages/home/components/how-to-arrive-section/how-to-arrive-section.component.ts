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

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-how-to-arrive-section',
  standalone: true,
  imports: [
    GoogleMap,
    MapAdvancedMarker,
    ButtonLandingComponent,
    SectionHeaderComponent,
    TranslatedPipe,
    TranslateModule
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
  /**
   * Mapa SATELITAL: fotografía real del terreno, que es lo que enseña de
   * verdad dónde está el hotel —rodeado de selva, junto al río— cosa que el
   * mapa de calles no cuenta.
   *
   * Se usa `hybrid` y no `satellite` a secas: es la misma imagen de satélite
   * pero conserva encima los nombres de vías y poblaciones. En una página de
   * "cómo llegar" eso importa, porque sin etiquetas la foto es bonita pero no
   * sirve para orientarse. Para foto limpia, cambiar a `'satellite'`.
   *
   * `mapTypeControl` queda activo para poder volver al mapa de calles.
   *
   * ⚠️ `mapId` es obligatorio para `map-advanced-marker`: sin él el marcador no
   * se dibuja. `DEMO_MAP_ID` es el identificador de PRUEBAS de Google; para
   * producción conviene crear uno propio en Google Cloud y ponerlo aquí.
   */
  mapOptions: google.maps.MapOptions = {
    mapId: 'DEMO_MAP_ID',
    mapTypeId: 'hybrid',
    mapTypeControl: true,
    streetViewControl: false,
    fullscreenControl: true
  };

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
