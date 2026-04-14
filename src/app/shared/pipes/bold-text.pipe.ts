import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'boldText',
  standalone: true
})
export class BoldTextPipe implements PipeTransform {
  constructor(private readonly _sanitizer: DomSanitizer) {}

  transform(value: string | null | undefined): SafeHtml {
    if (!value) return '';
    const html = value.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    return this._sanitizer.bypassSecurityTrustHtml(html);
  }
}
