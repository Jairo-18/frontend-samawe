import { Pipe, PipeTransform, inject } from '@angular/core';
import { LangService } from '../services/lang.service';
import { TranslatedField } from '../types/translated-field.type';

@Pipe({
  name: 'translated',
  pure: false,
  standalone: true
})
export class TranslatedPipe implements PipeTransform {
  private readonly _lang: LangService = inject(LangService);

  transform(value: TranslatedField | string | null | undefined): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    const lang = this._lang.lang();
    return value[lang] ?? value['es'] ?? Object.values(value)[0] ?? '';
  }
}
