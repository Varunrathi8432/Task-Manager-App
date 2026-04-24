import { Component, ChangeDetectionStrategy, Input, OnInit, HostBinding, signal, computed, inject } from '@angular/core';
import { FormGroup, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { OverlayModule } from '@angular/cdk/overlay';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { DateRangeValue, FilterField } from '../../dynamic-filter.types';

@Component({
  selector: 'app-date-range-filter',
  standalone: true,
  imports: [ReactiveFormsModule, OverlayModule, MatIconModule, MatTooltipModule],
  templateUrl: './date-range-filter.component.html',
  styleUrl: './date-range-filter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateRangeFilterComponent implements OnInit {
  private fb = inject(FormBuilder);

  @Input({ required: true }) group!: FormGroup;
  @Input({ required: true }) field!: FilterField;
  @HostBinding('attr.id') get hostId() { return this.field?.id; }
  @HostBinding('class') hostClass = 'app-btn';

  isOpen = signal(false);
  range = signal<DateRangeValue>({ start: null, end: null });

  selectedLength = computed(() => {
    const r = this.range();
    return (r.start ? 1 : 0) + (r.end ? 1 : 0);
  });

  ngOnInit(): void {
    const empty: DateRangeValue = { start: null, end: null };
    if (!this.group.contains(this.field.name)) {
      this.group.addControl(this.field.name, this.fb.control(empty));
    }
    const ctrl = this.group.get(this.field.name);
    if (ctrl) {
      this.range.set(ctrl.value ?? empty);
      ctrl.valueChanges.subscribe(v => this.range.set(v ?? empty));
    }
  }

  toggle(): void { this.isOpen.update(v => !v); }
  close(): void { this.isOpen.set(false); }

  onStartChange(value: string): void {
    const ctrl = this.group.get(this.field.name);
    if (!ctrl) return;
    ctrl.setValue({ ...(ctrl.value ?? {}), start: value || null });
  }

  onEndChange(value: string): void {
    const ctrl = this.group.get(this.field.name);
    if (!ctrl) return;
    ctrl.setValue({ ...(ctrl.value ?? {}), end: value || null });
  }

  onClear(): void {
    this.group.get(this.field.name)?.setValue({ start: null, end: null });
  }
}
