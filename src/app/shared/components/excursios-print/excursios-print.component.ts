import { Component, inject, Input, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ExcursionComplete } from '../../../service-and-product/interface/excursion.interface';
import { FormatCopPipe } from '../../pipes/format-cop.pipe';
import { CommonModule } from '@angular/common';
import { formatCop } from '../../utilities/currency.utilities.service';
import { loadPdfMake } from '../../utilities/pdf-maker.utils';

@Component({
  selector: 'app-excursios-print',
  standalone: true,
  imports: [FormatCopPipe, CommonModule],
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
      { text: e.categoryType?.name || 'N/A', fontSize: 10 },
      { text: e.name || 'N/A', fontSize: 10 },
      { text: formatCop(e.priceBuy ?? 0), fontSize: 10, alignment: 'right' },
      { text: formatCop(e.priceSale ?? 0), fontSize: 10, alignment: 'right' }
    ]);

    const doc = {
      pageMargins: [40, 40, 40, 40],
      defaultStyle: { font: defaultFont, fontSize: 10 },
      content: [
        { text: 'Lista de Pasadías y Servicios', bold: true, fontSize: 14, marginBottom: 8 },
        {
          table: {
            headerRows: 1,
            widths: [80, '*', 70, 70],
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
