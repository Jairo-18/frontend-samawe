import { Pipe, PipeTransform } from '@angular/core';
@Pipe({ name: 'formatPercent', standalone: true })
export class FormatPercentPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null) return '-';
    return `${Math.round(value * 100)}%`;
  }
}
