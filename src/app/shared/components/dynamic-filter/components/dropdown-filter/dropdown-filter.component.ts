import { Component, ChangeDetectionStrategy, Input, OnInit, HostBinding, signal, computed, inject } from '@angular/core';
import { FormGroup, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { OverlayModule } from '@angular/cdk/overlay';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { FilterField, FilterOption } from '../../dynamic-filter.types';

@Component({
  selector: 'app-dropdown-filter',
  standalone: true,
  imports: [ReactiveFormsModule, OverlayModule, MatIconModule, MatTooltipModule],
  templateUrl: './dropdown-filter.component.html',
  styleUrl: './dropdown-filter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DropdownFilterComponent implements OnInit {
  private fb = inject(FormBuilder);

  @Input({ required: true }) group!: FormGroup;
  @Input({ required: true }) field!: FilterField;
  @HostBinding('attr.id') get hostId() { return this.field?.id; }
  @HostBinding('class') hostClass = 'app-btn';

  isOpen = signal(false);
  selected = signal<unknown>(null);

  selectedLength = computed(() => {
    const v = this.selected();
    if (v === null || v === undefined || v === '') return 0;
    if (Array.isArray(v)) return v.length;
    return 1;
  });

  ngOnInit(): void {
    const initial: unknown = this.field.isMultiple ? [] : null;
    if (!this.group.contains(this.field.name)) {
      this.group.addControl(this.field.name, this.fb.control(initial));
    }
    const ctrl = this.group.get(this.field.name);
    if (ctrl) {
      this.selected.set(ctrl.value ?? initial);
      ctrl.valueChanges.subscribe(v => this.selected.set(v ?? initial));
    }
  }

  toggle(): void {
    this.isOpen.update(v => !v);
  }

  close(): void {
    this.isOpen.set(false);
  }

  isSelected(option: FilterOption): boolean {
    const v = this.selected();
    if (this.field.isMultiple) {
      return Array.isArray(v) && v.includes(option.id);
    }
    return v === option.id;
  }

  toggleOption(option: FilterOption): void {
    const ctrl = this.group.get(this.field.name);
    if (!ctrl) return;
    if (this.field.isMultiple) {
      const current = Array.isArray(ctrl.value) ? [...ctrl.value] : [];
      const idx = current.indexOf(option.id);
      if (idx >= 0) current.splice(idx, 1);
      else current.push(option.id);
      ctrl.setValue(current);
    } else {
      ctrl.setValue(ctrl.value === option.id ? null : option.id);
      this.close();
    }
  }

  onClear(): void {
    this.group.get(this.field.name)?.setValue(this.field.isMultiple ? [] : null);
  }
}
