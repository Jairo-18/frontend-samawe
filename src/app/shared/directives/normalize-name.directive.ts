import { Directive, HostListener } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appNormalizeName]',
  standalone: true
})
export class NormalizeNameDirective {
  constructor(private control: NgControl) {}

  private capitalize(value: string): string {
    return value
      .split(' ')
      .map((word) =>
        word.length > 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word
      )
      .join(' ');
  }

  @HostListener('input', ['$event'])
  onInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const cursor = input.selectionStart;
    let value = input.value;
    value = value.replace(/^\s+/, '');
    value = value.replace(/\s{2,}/g, ' ');
    value = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑàèìòùÀÈÌÒÙ\s\-']/g, '');
    value = this.capitalize(value);
    this.control.control?.setValue(value, { emitEvent: false });
    input.value = value;
    input.setSelectionRange(cursor, cursor);
  }

  @HostListener('blur', ['$event'])
  onBlur(event: Event) {
    const input = event.target as HTMLInputElement;
    const trimmed = this.capitalize(
      input.value.trim().replace(/\s{2,}/g, ' ')
    );
    this.control.control?.setValue(trimmed, { emitEvent: false });
    input.value = trimmed;
  }
}
