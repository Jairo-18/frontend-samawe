import { ChangeDetectorRef, OnDestroy, Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { TranslatedField } from '../types/translated-field.type';

@Pipe({
  name: 'translated',
  pure: false,
  standalone: true
})
export class TranslatedPipe implements PipeTransform, OnDestroy {
  private readonly _translate: TranslateService = inject(TranslateService);
  private readonly _cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private readonly _sub: Subscription;

  constructor() {
    this._sub = this._translate.onLangChange.subscribe(() => this._cdr.markForCheck());
  }

  transform(value: TranslatedField | string | null | undefined): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    const lang = this._translate.currentLang ?? this._translate.defaultLang ?? 'es';
    return value[lang] ?? value['es'] ?? Object.values(value)[0] ?? '';
  }

  ngOnDestroy(): void {
    this._sub.unsubscribe();
  }
}
