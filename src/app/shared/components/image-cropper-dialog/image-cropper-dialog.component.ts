import { Component, Inject, ViewChild } from '@angular/core';
import { EntityType } from '../../services/image.service';
import { CommonModule } from '@angular/common';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ImageCropperComponent, ImageCroppedEvent } from 'ngx-image-cropper';
import { BaseDialogComponent } from '../base-dialog/base-dialog.component';

/** `value: null` = recorte libre, sin proporción forzada. */
export interface CropRatio {
  key: string;
  label: string;
  icon: string;
  value: number | null;
}

export const CROP_RATIOS: CropRatio[] = [
  { key: 'free', label: 'Libre', icon: 'crop_free', value: null },
  { key: '1:1', label: 'Cuadrada', icon: 'crop_square', value: 1 },
  { key: '4:3', label: 'Horizontal', icon: 'crop_landscape', value: 4 / 3 },
  { key: '3:4', label: 'Vertical', icon: 'crop_portrait', value: 3 / 4 },
  { key: '16:9', label: 'Panorámica', icon: 'panorama_wide_angle', value: 16 / 9 }
];

@Component({
  selector: 'app-image-cropper-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    ImageCropperComponent,
    BaseDialogComponent
  ],
  templateUrl: './image-cropper-dialog.component.html',
  styleUrls: ['./image-cropper-dialog.component.scss']
})
export class ImageCropperDialogComponent {
  @ViewChild(ImageCropperComponent) private cropper?: ImageCropperComponent;

  imageFile?: File;
  croppedImage: Blob | null | undefined = null;
  rotation = 0;
  zoomFactor = 1;
  isLoading = true;

  readonly ratios = CROP_RATIOS;
  selectedRatio: CropRatio;

  constructor(
    public dialogRef: MatDialogRef<ImageCropperDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { file: File; entityType?: EntityType }
  ) {
    this.imageFile = data.file;
    // Libre por defecto para todo: el usuario elige la proporción él mismo
    // desde el diálogo si quiere una fija. Antes se forzaba cuadrada/horizontal
    // según el tipo y sacrificaba parte de la foto sin que lo pidiera nadie.
    this.selectedRatio = CROP_RATIOS.find((r) => r.key === 'free')!;
  }

  get maintainAspectRatio(): boolean {
    return this.selectedRatio.value !== null;
  }

  /** `aspectRatio` se ignora cuando no se mantiene proporción; el 1 es relleno. */
  get aspectRatio(): number {
    return this.selectedRatio.value ?? 1;
  }

  selectRatio(ratio: CropRatio): void {
    if (ratio.key === this.selectedRatio.key) return;
    this.selectedRatio = ratio;
    // Sin esto el marco conserva la forma anterior hasta que el usuario lo
    // arrastra: la proporción nueva no se aplica sola al recuadro ya dibujado.
    this.cropper?.resetCropperPosition();
  }

  resetImage() {
    this.rotation = 0;
    this.zoomFactor = 1;
    this.cropper?.resetCropperPosition();
  }

  imageCropped(event: ImageCroppedEvent) {
    this.croppedImage = event.blob;
  }

  imageLoaded() {
    this.isLoading = false;
  }

  cropperReady() {
    this.isLoading = false;
  }

  loadImageFailed() {
    this.isLoading = false;
  }

  rotateLeft() {
    this.rotation--;
  }

  rotateRight() {
    this.rotation++;
  }

  zoomOut() {
    this.zoomFactor -= 0.1;
  }

  zoomIn() {
    this.zoomFactor += 0.1;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.croppedImage) {
      this.dialogRef.close(this.croppedImage);
    }
  }
}
