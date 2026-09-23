import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { DEFAULT_ITEM } from '../../constants/avatar.constants';

export interface ItemImagesDialogData {
  /** Nombre del ítem, como encabezado del visor. */
  title?: string;
  /** Fotos del ítem. Si llega vacío se muestra la genérica. */
  images?: { imageUrl?: string }[] | null;
  /**
   * Proporción del recuadro. Por defecto `4/3`, que sirve para las fotos del
   * catálogo; el fondo del login o del registro se ven en vertical y necesitan
   * `3/4`, o saldrían recortados justo por donde importa.
   */
  aspect?: string;
}

/**
 * Visor de las fotos de un ítem del catálogo (producto, hospedaje, pasadía),
 * de **solo lectura**, pensado para abrirse desde los listados.
 *
 * Es el equivalente de `AvatarPreviewDialogComponent` para personas, pero con
 * dos diferencias que justifican un componente aparte en vez de reusar aquel:
 * un ítem puede tener **varias** fotos (hay que poder pasarlas) y no son
 * retratos, así que se ven en rectángulo y no en círculo.
 */
@Component({
  selector: 'app-item-images-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    TranslateModule
  ],
  templateUrl: './item-images-dialog.component.html'
})
export class ItemImagesDialogComponent {
  private readonly _dialogRef =
    inject<MatDialogRef<ItemImagesDialogComponent>>(MatDialogRef);
  readonly data: ItemImagesDialogData = inject(MAT_DIALOG_DATA) ?? {};
  readonly defaultItem = DEFAULT_ITEM;

  index = 0;

  /** Solo las fotos con URL; una lista vacía se resuelve con la genérica. */
  readonly urls: string[] = (this.data.images ?? [])
    .map((img) => img?.imageUrl)
    .filter((url): url is string => !!url);

  get currentUrl(): string {
    return this.urls[this.index] ?? this.defaultItem;
  }

  /**
   * Proporción del recuadro, como valor CSS y NO como clase de Tailwind.
   *
   * Una clase construida en tiempo de ejecución (`aspect-[${x}]`) no la ve el
   * compilador de Tailwind al analizar las plantillas, así que no acabaría en
   * el CSS y el recuadro se quedaría sin proporción.
   */
  get aspectRatio(): string {
    return this.data.aspect ?? '4 / 3';
  }

  /**
   * ¿Lo que se está viendo es un vídeo?
   *
   * Se mira la EXTENSIÓN de la URL y no un campo aparte porque el visor recibe
   * una lista de urls sueltas; el vídeo de portada es hoy el único caso.
   */
  get isVideo(): boolean {
    return /\.(mp4|webm)(\?|$)/i.test(this.currentUrl);
  }

  get hasMany(): boolean {
    return this.urls.length > 1;
  }

  /** Avanza en círculo: desde la última se vuelve a la primera. */
  next(): void {
    if (!this.hasMany) return;
    this.index = (this.index + 1) % this.urls.length;
  }

  previous(): void {
    if (!this.hasMany) return;
    this.index = (this.index - 1 + this.urls.length) % this.urls.length;
  }

  select(i: number): void {
    this.index = i;
  }

  close(): void {
    this._dialogRef.close();
  }
}
