import { Component, inject } from '@angular/core';
import { BaseDialogComponent } from '../base-dialog/base-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

/** Fragmento del mensaje a resaltar. `tone` colorea según su significado. */
export type DialogHighlight =
  | string
  | { text: string; tone?: 'success' | 'warn' | 'danger' };

interface MessagePart {
  text: string;
  /** Clases de resalte; vacío si es texto normal. */
  cls: string;
}

const TONE_CLASS: Record<string, string> = {
  brand: 'font-bold text-[var(--brand)]',
  success: 'font-bold text-[var(--success)]',
  warn: 'font-bold text-[var(--warning)]',
  danger: 'font-bold text-[var(--danger)]'
};

@Component({
  selector: 'app-yes-no-dialog',
  standalone: true,
  imports: [BaseDialogComponent, MatButtonModule],
  templateUrl: './yes-no-dialog.component.html',
  styleUrl: './yes-no-dialog.component.scss'
})
export class YesNoDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<YesNoDialogComponent>);
  public data?: {
    title: string;
    message: string;
    highlights?: DialogHighlight[];
  } = inject(MAT_DIALOG_DATA);

  /**
   * Mensaje partido en tramos normales y resaltados. Solo se arma si quien abre
   * el diálogo pasó `highlights`; si no, el mensaje se pinta como siempre
   * (texto plano en la descripción), así los demás diálogos no cambian.
   */
  readonly parts: MessagePart[] | null = this._buildParts();

  private _buildParts(): MessagePart[] | null {
    const message = this.data?.message;
    const items = (this.data?.highlights ?? [])
      .map((h) => (typeof h === 'string' ? { text: h, tone: 'brand' } : { tone: 'brand', ...h }))
      .filter((h) => h.text);
    if (!message || !items.length) return null;

    const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Los más largos primero, para que "112.500,00 COP" no se corte en un tramo
    // más corto que lo contenga.
    items.sort((a, b) => b.text.length - a.text.length);
    const toneOf = new Map(items.map((h) => [h.text, h.tone as string]));
    const re = new RegExp(`(${items.map((h) => escape(h.text)).join('|')})`, 'g');
    return message
      .split(re)
      .filter((t) => t !== '')
      .map((text) => ({
        text,
        cls: toneOf.has(text) ? TONE_CLASS[toneOf.get(text)!] : ''
      }));
  }

  closeDialog(confirm: boolean): void {
    this.dialogRef.close(confirm);
  }
  confirmAction(): void {
    this.closeDialog(true);
  }
  cancelAction(): void {
    this.closeDialog(false);
  }
}
