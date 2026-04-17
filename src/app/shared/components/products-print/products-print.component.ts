import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ProductComplete } from './../../../service-and-product/interface/product.interface';
import { Component, ElementRef, inject, Input, PLATFORM_ID, ViewChild } from '@angular/core';
import { FormatCopPipe } from '../../../shared/pipes/format-cop.pipe';
@Component({
  selector: 'app-products-print',
  imports: [FormatCopPipe, CommonModule],
  templateUrl: './products-print.component.html',
  styleUrl: './products-print.component.scss'
})
export class ProductsPrintComponent {
  @Input() products: ProductComplete[] = [];
  @ViewChild('printSection') printSection!: ElementRef;
  private readonly _platformId = inject(PLATFORM_ID);
  get totalSaleValue(): number {
    return this.products.reduce(
      (sum, p) => sum + (p.priceSale ?? 0) * (p.amount ?? 0),
      0
    );
  }
  print() {
    if (!isPlatformBrowser(this._platformId)) return;
    console.warn('print: html2pdf removed — pending SSR-compatible replacement');
  }
}

