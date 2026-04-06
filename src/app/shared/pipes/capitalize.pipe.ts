import { Pipe, PipeTransform } from '@angular/core';

const LOWERCASE_WORDS = new Set([
  'de', 'del', 'la', 'las', 'el', 'los', 'un', 'una', 'unos', 'unas',
  'y', 'e', 'o', 'u', 'a', 'en', 'con', 'sin', 'por', 'para', 'entre'
]);

@Pipe({
  name: 'capitalize',
  standalone: true
})
export class CapitalizePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    return value
      .toLowerCase()
      .split(' ')
      .map((word, index) =>
        index === 0 || !LOWERCASE_WORDS.has(word)
          ? word.charAt(0).toUpperCase() + word.slice(1)
          : word
      )
      .join(' ');
  }
}
