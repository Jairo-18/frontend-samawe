import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ProductComplete } from './../../../service-and-product/interface/product.interface';
import { Component, inject, Input, PLATFORM_ID } from '@angular/core';
import { FormatCopPipe } from '../../../shared/pipes/format-cop.pipe';
import { TranslatedPipe } from '../../../shared/pipes/translated.pipe';
import { formatCop } from '../../utilities/currency.utilities.service';
import { loadPdfMake } from '../../utilities/pdf-maker.utils';
import { TranslateModule } from '@ngx-translate/core';

// `name` (producto/categoría) es un TranslatedField ({ es, en }), no un
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
  selector: 'app-products-print',
  imports: [FormatCopPipe, CommonModule, TranslatedPipe, TranslateModule],
  templateUrl: './products-print.component.html',
  styleUrl: './products-print.component.scss'
})
export class ProductsPrintComponent {
  @Input() products: ProductComplete[] = [];
  @Input() totalInventory?: number;
  private readonly _platformId = inject(PLATFORM_ID);

  get totalSaleValue(): number {
    if (this.totalInventory !== undefined) return this.totalInventory;
    return this.products.reduce((sum, p) => {
      const amount = p.amount ?? 0;
      const priceSale = p.priceSale ?? 0;
      const priceBuy = p.priceBuy ?? 0;
      if (amount <= 0 || priceSale <= 0 || priceBuy <= 0) return sum;
      return sum + priceSale * amount;
    }, 0);
  }

  async print() {
    if (!isPlatformBrowser(this._platformId)) return;
    const { pdfMake, defaultFont } = await loadPdfMake();
    const color = '#486e2b';
    const headerStyle = { bold: true, color: '#ffffff', fontSize: 10, fillColor: color };

    const rows = this.products.map(p => [
      { text: p.categoryType?.code || 'N/A', fontSize: 9 },
      { text: tField(p.name) || 'N/A', fontSize: 9 },
      { text: String(p.amount ?? 0), fontSize: 9, alignment: 'center' },
      { text: formatCop(p.priceBuy ?? 0), fontSize: 8.5, alignment: 'right' },
      { text: formatCop(p.priceSale ?? 0), fontSize: 8.5, alignment: 'right' }
    ]);

    const doc = {
      pageMargins: [40, 40, 40, 40],
      defaultStyle: { font: defaultFont, fontSize: 10 },
      content: [
        { text: 'Lista de Productos, Bar, Mecato, Restaurante y Otros', bold: true, fontSize: 14, marginBottom: 8 },
        {
          // Precios en columnas de 85pt (antes 70): "295.000,00 COP" no cabía
          // a fontSize 10 y pdfMake partía la palabra "COP" a media línea.
          table: {
            headerRows: 1,
            widths: [50, '*', 35, 85, 85],
            body: [
              [
                { text: 'Categoría', ...headerStyle },
                { text: 'Nombre', ...headerStyle },
                { text: 'UN', ...headerStyle, alignment: 'center' },
                { text: 'P. Compra', ...headerStyle, alignment: 'right' },
                { text: 'P. Venta', ...headerStyle, alignment: 'right' }
              ],
              ...rows,
              [
                { text: 'Precio Total Del Inventario:', bold: true, colSpan: 4, alignment: 'right', fontSize: 10 },
                '', '', '',
                { text: formatCop(this.totalSaleValue), bold: true, alignment: 'right', fontSize: 9 }
              ]
            ]
          },
          layout: 'lightHorizontalLines'
        }
      ]
    };

    const fecha = new Date().toLocaleDateString('es-CO').replace(/\//g, '-');
    pdfMake.createPdf(doc).download(`Productos_${fecha}.pdf`);
  }
}
