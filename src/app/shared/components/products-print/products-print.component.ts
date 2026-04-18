import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ProductComplete } from './../../../service-and-product/interface/product.interface';
import { Component, inject, Input, PLATFORM_ID } from '@angular/core';
import { FormatCopPipe } from '../../../shared/pipes/format-cop.pipe';
import { formatCop } from '../../utilities/currency.utilities.service';
import { loadPdfMake } from '../../utilities/pdf-maker.utils';

@Component({
  selector: 'app-products-print',
  imports: [FormatCopPipe, CommonModule],
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
      { text: p.categoryType?.name || 'N/A', fontSize: 10 },
      { text: p.name || 'N/A', fontSize: 10 },
      { text: String(p.amount ?? 0), fontSize: 10, alignment: 'center' },
      { text: formatCop(p.priceBuy ?? 0), fontSize: 10, alignment: 'right' },
      { text: formatCop(p.priceSale ?? 0), fontSize: 10, alignment: 'right' }
    ]);

    const doc = {
      pageMargins: [40, 40, 40, 40],
      defaultStyle: { font: defaultFont, fontSize: 10 },
      content: [
        { text: 'Lista de Productos, Bar, Mecato, Restaurante y Otros', bold: true, fontSize: 14, marginBottom: 8 },
        {
          table: {
            headerRows: 1,
            widths: [80, '*', 40, 70, 70],
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
                { text: formatCop(this.totalSaleValue), bold: true, alignment: 'right', fontSize: 10 }
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
