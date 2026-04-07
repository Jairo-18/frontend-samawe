import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ColorSwatch,
  PALETTE_1,
  PALETTE_2,
  PALETTE_3
} from '../../constants/color.constants';

// const ACTIVE_PALETTE = PALETTE_1;
const ACTIVE_PALETTE = PALETTE_2;
// const ACTIVE_PALETTE = PALETTE_3;

@Component({
  selector: 'app-color-palette',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './color-palette.component.html',
  styleUrl: './color-palette.component.scss'
})
export class ColorPaletteComponent {
  palette = ACTIVE_PALETTE;
  colors: ColorSwatch[] = ACTIVE_PALETTE.colors;

  get cssVars(): string {
    return this.colors.map((c) => `${c.variable}: ${c.hex}`).join('; ');
  }

  copied: string | null = null;

  copy(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.copied = text;
      setTimeout(() => (this.copied = null), 1500);
    });
  }
}
