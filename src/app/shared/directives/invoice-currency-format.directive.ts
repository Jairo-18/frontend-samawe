import {
  Directive,
  ElementRef,
  HostListener,
  Inject,
  OnInit,
  Optional,
  Self,
  OnDestroy,
  Input
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { NgControl } from '@angular/forms';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[appInvoiceCurrencyFormat]',
  standalone: true
})
export class InvoiceCurrencyFormatDirective implements OnInit, OnDestroy {
  @Input() appInvoiceCurrencyFormat: string | number = 2;

  private elInput: HTMLInputElement;
  private sub?: Subscription;
  private lastValue = '';

  constructor(
    private el: ElementRef,
    @Optional() @Self() private control: NgControl,
    @Inject(DOCUMENT) private _document: Document
  ) {
    this.elInput = this.el.nativeElement;
  }

  ngOnInit() {
    setTimeout(() => {
      this.formatAndSetDisplay(this.control.value);
    }, 0);

    this.sub = this.control.valueChanges?.subscribe((val) => {
      if (this._document.activeElement !== this.elInput) {
        this.formatAndSetDisplay(val);
      }
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  get decimals(): number {
    const parsed =
      typeof this.appInvoiceCurrencyFormat === 'string'
        ? parseInt(this.appInvoiceCurrencyFormat, 10)
        : this.appInvoiceCurrencyFormat;
    return isNaN(parsed) ? 2 : parsed;
  }

  private formatAndSetDisplay(val: number | string | null | undefined): void {
    let numStr = '';
    if (val === null || val === undefined || val === '') {
      this.elInput.value = '';
      this.lastValue = '';
      return;
    }

    if (typeof val === 'number') {
      if (isNaN(val)) {
        this.elInput.value = '';
        this.lastValue = '';
        return;
      }

      numStr = val.toFixed(this.decimals);
    } else if (typeof val === 'string') {
      let cleanStr = val.trim();
      if (cleanStr.includes(',')) {
        cleanStr = cleanStr.replace(/\./g, '').replace(',', '.');
      }

      const parsed = parseFloat(cleanStr);
      if (isNaN(parsed)) {
        this.elInput.value = '';
        this.lastValue = '';
        return;
      }
      numStr = parsed.toFixed(this.decimals);
    }

    const parts = numStr.split('.');
    const integer = parts[0];
    const decimal = parts[1] || '00';

    const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    let finalFormatted = formattedInteger;
    if (this.decimals > 0) {
      finalFormatted = `${formattedInteger},${decimal}`;
    }

    this.elInput.value = finalFormatted;
    this.lastValue = finalFormatted;
  }

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    let value = this.elInput.value;

    if (event instanceof InputEvent && event.data === '.') {
      const cursor = this.elInput.selectionStart || 0;
      if (cursor > 0) {
        value = value.substring(0, cursor - 1) + ',' + value.substring(cursor);
      }
    }

    const cleanValue = value.replace(/[^\d,]/g, '');

    let processedValue = '';
    let commaFound = false;

    for (const char of cleanValue) {
      if (char === ',') {
        if (!commaFound) {
          processedValue += char;
          commaFound = true;
        }
      } else {
        processedValue += char;
      }
    }

    const parts = processedValue.split(',');
    let integerPart = parts[0];
    let decimalPart: string | undefined = parts[1];

    if (decimalPart !== undefined && this.decimals > 0) {
      decimalPart = decimalPart.substring(0, this.decimals);
    } else if (this.decimals === 0) {
      decimalPart = undefined;
    }

    if (integerPart.length > 1 && integerPart.startsWith('0')) {
      integerPart = integerPart.replace(/^0+/, '');
      if (integerPart === '') integerPart = '0';
    }
    if (integerPart === '') {
      integerPart = '0';
    }

    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    let finalValue = formattedInteger;
    if (decimalPart !== undefined && this.decimals > 0) {
      finalValue += `,${decimalPart}`;
    } else if (value.endsWith(',') && this.decimals > 0) {
      finalValue += ',';
    }

    const cursor = this.elInput.selectionStart || 0;
    const oldLength = this.elInput.value.length;

    this.elInput.value = finalValue;
    this.lastValue = finalValue;

    const diff = finalValue.length - oldLength;
    const newCursor = Math.max(0, cursor + diff);

    this.elInput.setSelectionRange(newCursor, newCursor);

    const numericStr = finalValue.replace(/\./g, '').replace(',', '.');
    if (!numericStr) {
      this.updateControl(null);
      return;
    }

    const num = parseFloat(numericStr);
    this.updateControl(isNaN(num) ? null : num);
  }

  private updateControl(num: number | null): void {
    if (this.control && this.control.control) {
      setTimeout(() => {
        this.control.control?.setValue(num, {
          emitEvent: true,
          emitModelToViewChange: false
        });
      }, 0);
    }
  }

  @HostListener('blur')
  onBlur(): void {
    const val = this.elInput.value;
    if (!val) {
      this.updateControl(null);
      return;
    }

    const numericStr = val.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(numericStr);

    this.formatAndSetDisplay(isNaN(num) ? null : num);
    this.updateControl(isNaN(num) ? null : num);
  }
}
