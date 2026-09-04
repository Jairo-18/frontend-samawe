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
import { DEFAULT_AVATAR } from '../../constants/avatar.constants';

export interface AvatarPreviewData {
  /** URL de la foto; si falta se muestra la imagen genérica. */
  avatarUrl?: string | null;
  /** Nombre a mostrar bajo la foto. */
  name?: string;
  /**
   * Muestra los botones de moderación (cambiar / eliminar). Solo se activa en
   * la edición de un usuario, para que desde el listado la foto sea de lectura.
   */
  allowManage?: boolean;
  /** Ya hay una foto que se pueda eliminar. */
  canRemove?: boolean;
}

export type AvatarPreviewResult = { action: 'change' } | { action: 'remove' };

/**
 * Visor de foto de perfil reutilizable: se usa desde el listado de usuarios
 * (solo ver) y desde la edición de un usuario (ver + moderar).
 */
@Component({
  selector: 'app-avatar-preview-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    TranslateModule
  ],
  templateUrl: './avatar-preview-dialog.component.html'
})
export class AvatarPreviewDialogComponent {
  private readonly _dialogRef =
    inject<MatDialogRef<AvatarPreviewDialogComponent, AvatarPreviewResult>>(
      MatDialogRef
    );
  readonly data: AvatarPreviewData = inject(MAT_DIALOG_DATA) ?? {};
  readonly defaultAvatar = DEFAULT_AVATAR;

  get imageUrl(): string {
    return this.data.avatarUrl || DEFAULT_AVATAR;
  }

  close(): void {
    this._dialogRef.close();
  }

  change(): void {
    this._dialogRef.close({ action: 'change' });
  }

  remove(): void {
    this._dialogRef.close({ action: 'remove' });
  }
}
