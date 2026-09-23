import { Component, inject, Input, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ExcursionComplete } from '../../../service-and-product/interface/excursion.interface';
import { FormatCopPipe } from '../../pipes/format-cop.pipe';
import { TranslatedPipe } from '../../pipes/translated.pipe';
import { CommonModule } from '@angular/common';
import { formatCop } from '../../utilities/currency.utilities.service';
import { loadPdfMake } from '../../utilities/pdf-maker.utils';
import { TranslateModule } from '@ngx-translate/core';

// `name` (excursión/categoría) es un TranslatedField ({ es, en }), no un
// string. pdfMake no renderiza objetos: sin esto la celda salía en blanco en
// vez de tirar un error, porque `{ text: {...} }` no revienta, solo no pinta
// nada.
function tField(v: unknown): string {
  if (!v) return '';
  if (typeof v === 'string') return v;
  const obj = v as Record<string, string>;
  return obj['es'] || obj['en'] || Object.values(obj)[0] || '';
}

@Component({
  selector: 'app-excursios-print',
  standalone: true,
  imports: [FormatCopPipe, CommonModule, TranslatedPipe, TranslateModule],
  templateUrl: './excursios-print.component.html',
  styleUrl: './excursios-print.component.scss'
})
export class ExcursiosPrintComponent {
  @Input() excursions: ExcursionComplete[] = [];
  private readonly _platformId = inject(PLATFORM_ID);

  async print() {
    if (!isPlatformBrowser(this._platformId)) return;
    const { pdfMake, defaultFont } = await loadPdfMake();
    const color = '#486e2b';
    const headerStyle = { bold: true, color: '#ffffff', fontSize: 10, fillColor: color };

    const rows = this.excursions.map(e => [
      { text: e.categoryType?.code || 'N/A', fontSize: 9 },
      { text: tField(e.name) || 'N/A', fontSize: 9 },
      { text: formatCop(e.priceBuy ?? 0), fontSize: 8.5, alignment: 'right' },
      { text: formatCop(e.priceSale ?? 0), fontSize: 8.5, alignment: 'right' }
    ]);

    const doc = {
      pageMargins: [40, 40, 40, 40],
      defaultStyle: { font: defaultFont, fontSize: 10 },
      content: [
        { text: 'Lista de Pasadías y Servicios', bold: true, fontSize: 14, marginBottom: 8 },
        {
          // Precios en columnas de 90pt (antes 70): "295.000,00 COP" no cabía
          // a fontSize 10 y pdfMake partía la palabra "COP" a media línea.
          table: {
            headerRows: 1,
            widths: [50, '*', 90, 90],
            body: [
              [
                { text: 'Categoría', ...headerStyle },
                { text: 'Nombre', ...headerStyle },
                { text: 'P. Compra', ...headerStyle, alignment: 'right' },
                { text: 'P. Venta', ...headerStyle, alignment: 'right' }
              ],
              ...rows
            ]
          },
          layout: 'lightHorizontalLines'
        }
      ]
    };

    const fecha = new Date().toLocaleDateString('es-CO').replace(/\//g, '-');
    pdfMake.createPdf(doc).download(`Pasadias_Servicios_${fecha}.pdf`);
  }
}
