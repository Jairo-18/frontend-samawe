import { Component, ViewChild, Input, ElementRef, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ExcursionComplete } from '../../../service-and-product/interface/excursion.interface';
import { FormatCopPipe } from '../../pipes/format-cop.pipe';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-excursios-print',
  standalone: true,
  imports: [FormatCopPipe, CommonModule],
  templateUrl: './excursios-print.component.html',
  styleUrl: './excursios-print.component.scss'
})
export class ExcursiosPrintComponent {
  @Input() excursions: ExcursionComplete[] = [];
  @ViewChild('printSection') printSection!: ElementRef;
  private readonly _platformId = inject(PLATFORM_ID);
  print() {
    if (!isPlatformBrowser(this._platformId)) return;
    console.warn('print: html2pdf removed — pending SSR-compatible replacement');
  }
}

