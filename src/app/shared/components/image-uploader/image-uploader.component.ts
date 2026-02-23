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
    // The original code had `initialImages: ImageItem[] = [];`
    // If the intent was to keep the default empty array, it should be handled in the getter or constructor.
    // For now, we'll just assign the value.
  }
  get initialImages(): ImageItem[] {
    return this._initialImages;
  }
  private _initialImages: ImageItem[] = [];
  @Output() imagesChanged = new EventEmitter<ImageItem[]>();

  images: ImageItem[] = [];
  pendingFiles: File[] = [];
  pendingPreviews: string[] = [];
  isUploading: boolean = false;
  deletingIds: Set<number> = new Set();
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
    if (this.initialImages && this.initialImages.length > 0) {
      this.images = this.initialImages.map((img: unknown) =>
        this.imageService.mapResponseToStandardItem(
          this.entityType,
          img as RawImageItem
        )
      );
      this.loadedEntityId = this.entityId; // Assume we loaded since we have initial
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

  private handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    const filteredFiles = Array.from(files).filter((file) =>
      file.type.startsWith('image/')
    );

    if (filteredFiles.length === 0) return;

    if (!this.entityId) {
      // Modo creación: guardamos los archivos localmente
      this.pendingFiles.push(...filteredFiles);
      filteredFiles.forEach((file) => {
        this.pendingPreviews.push(URL.createObjectURL(file));
      });
      this.cdr.detectChanges();
    } else {
      // Modo edición: subida directa
      this.uploadFiles(filteredFiles);
    }
  }

  removePendingFile(index: number) {
    this.pendingFiles.splice(index, 1);
    this.pendingPreviews.splice(index, 1);
    this.cdr.detectChanges();
  }

  uploadPendingFiles(newEntityId: number): Promise<void> {
    return new Promise((resolve) => {
      if (this.pendingFiles.length === 0) {
        resolve();
        return;
      }

      this.entityId = newEntityId;
      this.isUploading = true;
      let completed = 0;
      const total = this.pendingFiles.length;

      this.pendingFiles.forEach((file) => {
        this.imageService
          .uploadImage(this.entityType, this.entityId, file)
          .subscribe({
            next: (res: UploadResponse) => {
              this.images = [...this.images, res.item];
              completed++;
              if (completed === total) {
                this.pendingFiles = [];
                this.pendingPreviews = [];
                this.checkUploadComplete(completed, total);
                resolve();
              }
            },
            error: (err: HttpErrorResponse) => {
              console.error(`Error subiendo la foto pendiente`, err);
              completed++;
              if (completed === total) {
                this.pendingFiles = [];
                this.pendingPreviews = [];
                this.checkUploadComplete(completed, total);
                resolve();
              }
            }
          });
      });
    });
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
        title: 'Eliminar imagen',
        message:
          '¿Estás seguro de que deseas eliminar esta imagen? Esta acción no se puede deshacer.'
      }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.deleteImage(image);
      }
    });
  }

  private deleteImage(image: ImageItem) {
    if (!image || !image.imageId) {
      console.error(
        'No se puede eliminar la imagen, imageId no válido:',
        image
      );
      return;
    }

    this.deletingIds.add(image.imageId);
    this.cdr.detectChanges();

    this.imageService
      .deleteImage(this.entityType, this.entityId, image.publicId)
      .subscribe({
        next: () => {
          this.images = this.images.filter(
            (img) => img.imageId !== image.imageId
          );
          this.deletingIds.delete(image.imageId);
          this.imagesChanged.emit(this.images);

          this.cdr.detectChanges();
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error eliminando la foto', err);
          this.deletingIds.delete(image.imageId);
          this.cdr.detectChanges();
        }
      });
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
