import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CustomTableService {
  convertHexToRGBA(hex: string | null | undefined, alphaPercent = 100): string {
    if (!hex) return 'transparent';
    const value = hex.trim().replace('#', '');
    if (value.length !== 3 && value.length !== 6) return hex;
    const expanded = value.length === 3
      ? value.split('').map(c => c + c).join('')
      : value;
    const r = parseInt(expanded.slice(0, 2), 16);
    const g = parseInt(expanded.slice(2, 4), 16);
    const b = parseInt(expanded.slice(4, 6), 16);
    const a = Math.max(0, Math.min(100, alphaPercent)) / 100;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
}
