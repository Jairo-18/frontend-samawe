import { Injectable } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';

@Injectable()
export class TranslatedPaginatorIntl extends MatPaginatorIntl {
  override changes = new Subject<void>();

  constructor(private readonly _translate: TranslateService) {
    super();
    this._translate.onLangChange.subscribe(() => {
      this._updateLabels();
      this.changes.next();
    });
    this._updateLabels();
  }

  private _updateLabels(): void {
    this.itemsPerPageLabel = this._translate.instant('paginator.items_per_page');
    this.nextPageLabel = this._translate.instant('paginator.next_page');
    this.previousPageLabel = this._translate.instant('paginator.previous_page');
    this.firstPageLabel = this._translate.instant('paginator.first_page');
    this.lastPageLabel = this._translate.instant('paginator.last_page');
  }

  override getRangeLabel = (page: number, pageSize: number, length: number): string => {
    const of = this._translate.instant('paginator.of');
    if (length === 0 || pageSize === 0) return `0 ${of} ${length}`;
    length = Math.max(length, 0);
    const startIndex = page * pageSize;
    const endIndex = startIndex < length
      ? Math.min(startIndex + pageSize, length)
      : startIndex + pageSize;
    return `${startIndex + 1} - ${endIndex} ${of} ${length}`;
  };
}
