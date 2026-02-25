import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ImageCropperComponent, ImageCroppedEvent } from 'ngx-image-cropper';

@Component({
  selector: 'app-image-cropper-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    ImageCropperComponent
  ],
  templateUrl: './image-cropper-dialog.component.html',
  styleUrls: ['./image-cropper-dialog.component.scss']
})
export class ImageCropperDialogComponent {
  imageFile?: File;
  croppedImage: Blob | null | undefined = null;
  rotation = 0;
  zoomFactor = 1;

  constructor(
    public dialogRef: MatDialogRef<ImageCropperDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { file: File }
  ) {
    this.imageFile = data.file;
  }

  resetImage() {
    this.rotation = 0;
    this.zoomFactor = 1;
  }

  imageCropped(event: ImageCroppedEvent) {
    this.croppedImage = event.blob;
  }

  imageLoaded() {
    // show cropper
  }

  cropperReady() {
    // cropper ready
  }

  loadImageFailed() {
    // show message
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
