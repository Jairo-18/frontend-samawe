import { Directive, HostListener } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appNoSpaces]',
  standalone: true
})
export class NoSpacesDirective {
  constructor(private control: NgControl) {}

  @HostListener('input', ['$event'])
  onInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\s/g, '').toUpperCase();
    this.control.control?.setValue(value, { emitEvent: false });
    input.value = value;
  }
}
