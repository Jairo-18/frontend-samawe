import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'relativeTime',
  standalone: true
})
export class RelativeTimePipe implements PipeTransform {
  transform(value: string | Date | number | null | undefined): string {
    if (!value) return '';

    const date = new Date(value);
    const now = new Date();

    const diffMs = now.getTime() - date.getTime();

    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    const formatTime = (d: Date) => {
      return d.toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    };

    const timeString = formatTime(date);

    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      if (diffMs > 0 && diffMins < 60) {
        if (diffMins <= 1) return 'hace un momento';
        return `hoy hace ${diffMins} min`;
      }
      if (diffHours === 1) return 'hoy hace 1 hora';
      return `hoy a las ${timeString}`;
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isYesterday) {
      return `ayer a las ${timeString}`;
    }

    const formatShortDate = (d: Date) => {
      const day = d.getDate();
      const month = d.getMonth() + 1;
      const year = d.getFullYear().toString().slice(-2);
      return `${day}/${month < 10 ? '0' + month : month}/${year} a las ${timeString}`;
    };

    return formatShortDate(date);
  }
}
