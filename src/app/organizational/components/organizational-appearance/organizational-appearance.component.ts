import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import {
  BODY_FONTS,
  TITLE_FONTS
} from '../../../shared/constants/fonts.constants';

@Component({
  selector: 'app-organizational-appearance',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    TranslateModule,
    MatTooltipModule
  ],
  templateUrl: './organizational-appearance.component.html',
  styleUrls: ['./organizational-appearance.component.scss']
})
export class OrganizationalAppearanceComponent {
  @Input() form!: FormGroup;
  @Output() save = new EventEmitter<void>();

  readonly titleFonts = TITLE_FONTS;
  readonly bodyFonts = BODY_FONTS;

  /**
   * Los tres grupos de color del panel, en el orden en que se muestran.
   *
   * Van como datos y no como bloques repetidos en la plantilla: los quince
   * selectores son idénticos salvo el control y el rótulo, y antes estaban
   * escritos a mano uno por uno —130 líneas en las que había que acordarse de
   * cambiar el `for`, el `id` y el `formControlName` a la vez—.
   */

  /** Identidad del hotel. Son los MISMOS en claro y en oscuro. */
  readonly brandColorFields = [
    { control: 'primaryColor', labelKey: 'organizational.appearance.primary' },
    {
      control: 'secondaryColor',
      labelKey: 'organizational.appearance.secondary'
    },
    { control: 'tertiaryColor', labelKey: 'organizational.appearance.tertiary' }
  ];

  /** Superficie y texto con el modo claro activo. */
  readonly lightColorFields = [
    {
      control: 'bgSecondaryColor',
      labelKey: 'organizational.appearance.bg_secondary'
    },
    {
      control: 'bgPrimaryColor',
      labelKey: 'organizational.appearance.bg_primary'
    },
    { control: 'titleColor', labelKey: 'organizational.appearance.title' },
    { control: 'textColor', labelKey: 'organizational.appearance.text' },
    { control: 'subtitleColor', labelKey: 'organizational.appearance.subtitle' }
  ];

  /** Los mismos papeles, con el modo oscuro activo. */
  readonly darkColorFields = [
    {
      control: 'darkBgSecondaryColor',
      labelKey: 'organizational.appearance.dark_bg'
    },
    {
      control: 'darkBgPrimaryColor',
      labelKey: 'organizational.appearance.dark_surface'
    },
    {
      control: 'darkTitleColor',
      labelKey: 'organizational.appearance.dark_title'
    },
    {
      control: 'darkTextColor',
      labelKey: 'organizational.appearance.dark_text'
    },
    {
      control: 'darkSubtitleColor',
      labelKey: 'organizational.appearance.dark_subtitle'
    }
  ];

  /**
   * Cada opción se pinta CON SU PROPIA fuente, que es la única forma de elegir
   * sin ir probando una por una y guardando cada vez.
   */
  fontPreview(family: string, fallback: string): Record<string, string> {
    return { 'font-family': `'${family}', ${fallback}` };
  }
}
