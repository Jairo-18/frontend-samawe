import {
  Component,
  AfterViewInit,
  input,
  InputSignal,
  effect,
  runInInjectionContext,
  Injector,
} from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-map',
  imports: [],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
})
export class MapComponent implements AfterViewInit {
  private map!: L.Map;
  private marker!: L.Marker;
  coordinates: InputSignal<[number, number]> =
    input.required<[number, number]>();
  message: InputSignal<string | undefined> = input<string>();
  private customIcon = L.icon({
    iconUrl: './images/about/map-pin.png',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });

  constructor(private injector: Injector) {}

  ngAfterViewInit(): void {
    this.initMap();

    runInInjectionContext(this.injector, () => {
      effect(() => {
        const coords = this.coordinates();
        this.updateMarker(coords);
      });
    });
  }

  private initMap(): void {
    const initialCoords = this.coordinates();

    this.map = L.map('map').setView(initialCoords, 17);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    this.marker = L.marker(initialCoords, { icon: this.customIcon })
      .addTo(this.map)
      .bindPopup(this.message() || 'Ubicación seleccionada')
      .openPopup();
  }

  private updateMarker(coords: [number, number]): void {
    if (this.marker) {
      this.marker.setLatLng(coords).openPopup();
      this.map.setView(coords, this.map.getZoom());
    }
  }
}
