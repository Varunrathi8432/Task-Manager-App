import { Pipe, PipeTransform } from '@angular/core';
import { formatDistanceToNow, parseISO, isPast } from 'date-fns';

@Pipe({ name: 'relativeDate', standalone: true })
export class RelativeDatePipe implements PipeTransform {
  transform(value: string | null): string {
    if (!value) return '';
    try {
      const date = parseISO(value);
      const distance = formatDistanceToNow(date, { addSuffix: true });
      return distance;
    } catch {
      return value;
    }
  }
}
