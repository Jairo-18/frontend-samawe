import { Injectable } from '@angular/core';

export interface MapCoords {
  lat: number;
  lng: number;
}

@Injectable({ providedIn: 'root' })
export class GoogleMapsStateService {
  private _coords: MapCoords | null = null;

  get coords(): MapCoords | null {
    return this._coords;
  }

  set coords(value: MapCoords) {
    this._coords = value;
  }
}
