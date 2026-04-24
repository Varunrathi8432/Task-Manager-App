import { Injectable } from '@angular/core';
import type { FilterField, FilterFormData } from './dynamic-filter.types';

@Injectable({ providedIn: 'root' })
export class DynamicFilterService {
  buildQueryParams(formValue: FilterFormData, fieldsArray: FilterField[]): string {
    const parts: string[] = [];
    for (const field of fieldsArray) {
      const value = formValue[field.name];
      if (!this.hasValue(value)) continue;
      if (Array.isArray(value)) {
        parts.push(`${encodeURIComponent(field.name)}=${value.map(v => encodeURIComponent(String(v))).join(',')}`);
      } else if (this.isDateRange(value)) {
        if (value.start) parts.push(`${encodeURIComponent(field.name)}_start=${encodeURIComponent(value.start)}`);
        if (value.end) parts.push(`${encodeURIComponent(field.name)}_end=${encodeURIComponent(value.end)}`);
      } else {
        parts.push(`${encodeURIComponent(field.name)}=${encodeURIComponent(String(value))}`);
      }
    }
    return parts.join('&');
  }

  isEmpty(formValue: FilterFormData, fieldsArray: FilterField[]): boolean {
    for (const field of fieldsArray) {
      if (this.hasValue(formValue[field.name])) return false;
    }
    return true;
  }

  private hasValue(value: unknown): boolean {
    if (value === null || value === undefined || value === '') return false;
    if (Array.isArray(value)) return value.length > 0;
    if (this.isDateRange(value)) return !!value.start || !!value.end;
    return true;
  }

  private isDateRange(value: unknown): value is { start: string | null; end: string | null } {
    return typeof value === 'object'
      && value !== null
      && 'start' in value
      && 'end' in value;
  }
}