import {
  Directive,
  ElementRef,
  HostListener,
  OnInit,
  Optional,
  Self,
  OnDestroy
} from '@angular/core';
import { NgControl } from '@angular/forms';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[appCurrencyFormat]',
  standalone: true
})
export class CurrencyFormatDirective implements OnInit, OnDestroy {
  private elInput: HTMLInputElement;
  private sub?: Subscription;
  private lastValue = '';

  constructor(
    private el: ElementRef,
    @Optional() @Self() private control: NgControl
  ) {
    this.elInput = this.el.nativeElement;
  }

  ngOnInit() {
    setTimeout(() => {
      this.formatAndSetDisplay(this.control.value);
    }, 0);

    this.sub = this.control.valueChanges?.subscribe((val) => {
      if (document.activeElement !== this.elInput) {
        this.formatAndSetDisplay(val);
      }
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
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
      numStr = val.toFixed(2);
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
      numStr = parsed.toFixed(2);
    }

    const parts = numStr.split('.');
    const integer = parts[0];
    const decimal = parts[1] || '00';

    const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    const finalFormatted = `${formattedInteger},${decimal}`;
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
    let decimalPart = parts[1];

    if (decimalPart !== undefined) {
      decimalPart = decimalPart.substring(0, 2);
    }

    if (integerPart.length > 1 && integerPart.startsWith('0')) {
      integerPart = integerPart.replace(/^0+/, '');
      if (integerPart === '') integerPart = '0';
    }

    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    let finalValue = formattedInteger;
    if (decimalPart !== undefined) {
      finalValue += `,${decimalPart}`;
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
          emitEvent: false,
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
