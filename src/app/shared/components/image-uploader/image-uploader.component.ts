import {
  ChangeDetectorRef,
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  ImageService,
  EntityType,
  UploadResponse
} from '../../services/image.service';
import { ImageItem, RawImageItem } from '../../interfaces/image.interface';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { YesNoDialogComponent } from '../yes-no-dialog/yes-no-dialog.component';
import { ImageCropperDialogComponent } from '../image-cropper-dialog/image-cropper-dialog.component';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-image-uploader',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule
  ],
  templateUrl: './image-uploader.component.html',
  styleUrls: ['./image-uploader.component.scss']
})
export class ImageUploaderComponent implements OnInit, OnChanges {
  @Input() entityId!: number;
  @Input() entityType!: EntityType;
  @Input() isLoading: boolean = false;
  @Input()
  set initialImages(value: ImageItem[]) {
    this._initialImages = value;
  }
  get initialImages(): ImageItem[] {
    return this._initialImages;
  }
  private _initialImages: ImageItem[] = [];
  @Output() imagesChanged = new EventEmitter<ImageItem[]>();

  images: ImageItem[] = [];
  pendingFiles: File[] = [];
  pendingPreviews: string[] = [];
  toDeleteImages: ImageItem[] = [];
  isUploading: boolean = false;
  previewImageUrl: string | null = null;
  isDragging: boolean = false;
  private loadedEntityId: number | null = null;

  constructor(
    private imageService: ImageService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.processInitialImages();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes['entityId'] &&
      changes['entityId'].currentValue !== changes['entityId'].previousValue
    ) {
      this.loadedEntityId = null;
      this.resetPending();
    }

    if (changes['initialImages']) {
      this.resetPending();
      this.processInitialImages();
    } else if (
      changes['entityId'] &&
      !changes['entityId'].firstChange &&
      !this.initialImages?.length &&
      this.entityId
    ) {
      if (this.loadedEntityId !== this.entityId) {
        this.loadImages();
      }
    }
  }

  private processInitialImages() {
    this.toDeleteImages = []; // Limpiar cola de eliminación al recargar
    if (this.initialImages && this.initialImages.length > 0) {
      this.images = this.initialImages.map((img: unknown) =>
        this.imageService.mapResponseToStandardItem(
          this.entityType,
          img as RawImageItem
        )
      );
      this.loadedEntityId = this.entityId;
      this.cdr.detectChanges();
    } else if (this.entityId && (!this.images || this.images.length === 0)) {
      if (this.loadedEntityId !== this.entityId) {
        this.loadImages();
      }
    } else {
      this.images = [];
      this.cdr.detectChanges();
    }
  }

  loadImages() {
    this.loadedEntityId = this.entityId; // Prevent subsequent triggers while loading or if it returns empty
    this.imageService.getImages(this.entityType, this.entityId).subscribe({
      next: (images) => {
        this.images = images;
        this.imagesChanged.emit(this.images);
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error cargando imágenes', err);
        this.loadedEntityId = null; // Revert if failed so we can try again
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files: FileList | null = input.files;
    this.handleFiles(files);
    input.value = '';
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    const files = event.dataTransfer?.files;
    if (files) {
      this.handleFiles(files);
    }
  }

  private async handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    const filteredFiles = Array.from(files).filter((file) =>
      file.type.startsWith('image/')
    );

    if (filteredFiles.length === 0) return;

    for (const file of filteredFiles) {
      // Abrir el cropper para cada imagen
      const croppedBlob = await this.openCropper(file);

      if (croppedBlob) {
        // Convertir Blob a File
        const croppedFile = new File([croppedBlob], file.name, {
          type: 'image/webp'
        });

        // Siempre guardamos localmente primero, incluso en modo edición
        this.pendingFiles.push(croppedFile);
        this.pendingPreviews.push(URL.createObjectURL(croppedFile));
        this.cdr.detectChanges();
      }
    }
  }

  private openCropper(file: File): Promise<Blob | null> {
    const dialogRef = this.dialog.open(ImageCropperDialogComponent, {
      data: { file },
      width: '600px',
      disableClose: true
    });

    return lastValueFrom(dialogRef.afterClosed());
  }

  removePendingFile(index: number) {
    this.pendingFiles.splice(index, 1);
    this.pendingPreviews.splice(index, 1);
    this.cdr.detectChanges();
  }

  /**
   * Ejecuta tanto las subidas como las eliminaciones pendientes en el servidor.
   * Se debe llamar al guardar el formulario padre.
   */
  async applyChanges(targetEntityId: number): Promise<void> {
    const finalId = targetEntityId || this.entityId;
    if (!finalId) return;

    this.isUploading = true;
    this.cdr.detectChanges();

    try {
      // 1. Ejecutar eliminaciones
      for (const image of this.toDeleteImages) {
        await lastValueFrom(
          this.imageService.deleteImage(
            this.entityType,
            finalId,
            image.publicId
          )
        );
      }
      this.toDeleteImages = [];

      // 2. Ejecutar subidas
      if (this.pendingFiles.length > 0) {
        for (const file of this.pendingFiles) {
          try {
            const res = await lastValueFrom(
              this.imageService.uploadImage(this.entityType, finalId, file)
            );
            this.images = [...this.images, res.item];
          } catch (err) {
            console.error('Error subiendo imagen en applyChanges', err);
          }
        }
        this.pendingFiles = [];
        this.pendingPreviews = [];
      }
    } finally {
      this.isUploading = false;
      this.imagesChanged.emit(this.images);
      this.cdr.detectChanges();
    }
  }

  // Mantenemos este por compatibilidad si algún componente lo busca, pero ahora redirige
  uploadPendingFiles(newEntityId: number): Promise<void> {
    return this.applyChanges(newEntityId);
  }

  resetPending() {
    this.pendingFiles = [];
    this.pendingPreviews = [];
    this.cdr.detectChanges();
  }

  uploadFiles(files: File[]) {
    if (!this.entityId) {
      return;
    }

    this.isUploading = true;
    let uploadsCompleted = 0;

    files.forEach((file) => {
      this.imageService
        .uploadImage(this.entityType, this.entityId, file)
        .subscribe({
          next: (res: UploadResponse) => {
            this.images = [...this.images, res.item];
            uploadsCompleted++;
            this.checkUploadComplete(uploadsCompleted, files.length);
          },
          error: (err: HttpErrorResponse) => {
            console.error(`Error subiendo la foto ${file.name}`, err);
            uploadsCompleted++;
            this.checkUploadComplete(uploadsCompleted, files.length);
          }
        });
    });
  }

  confirmDeleteImage(image: ImageItem) {
    const dialogRef = this.dialog.open(YesNoDialogComponent, {
      data: {
        title: 'Quitar imagen',
        message:
          '¿Deseas quitar esta imagen de la galería? El cambio se aplicará permanentemente al guardar.'
      }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.markForDeletion(image);
      }
    });
  }

  private markForDeletion(image: ImageItem) {
    // Simplemente movemos de la lista activa a la lista de "por borrar"
    this.images = this.images.filter((img) => img.imageId !== image.imageId);
    this.toDeleteImages.push(image);
    this.cdr.detectChanges();
  }

  openPreview(imageUrl: string) {
    this.previewImageUrl = imageUrl;
  }

  closePreview() {
    this.previewImageUrl = null;
  }

  private checkUploadComplete(completed: number, total: number) {
    if (completed === total) {
      this.isUploading = false;
      this.imagesChanged.emit(this.images);
      this.cdr.detectChanges();
    }
  }
}
