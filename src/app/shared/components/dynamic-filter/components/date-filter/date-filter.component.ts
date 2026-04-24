import { Component, ChangeDetectionStrategy, Input, OnInit, HostBinding, signal, computed, inject } from '@angular/core';
import { FormGroup, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { OverlayModule } from '@angular/cdk/overlay';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { FilterField } from '../../dynamic-filter.types';

@Component({
  selector: 'app-date-filter',
  standalone: true,
  imports: [ReactiveFormsModule, OverlayModule, MatIconModule, MatTooltipModule],
  templateUrl: './date-filter.component.html',
  styleUrl: './date-filter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateFilterComponent implements OnInit {
  private fb = inject(FormBuilder);

  @Input({ required: true }) group!: FormGroup;
  @Input({ required: true }) field!: FilterField;
  @HostBinding('attr.id') get hostId() { return this.field?.id; }
  @HostBinding('class') hostClass = 'app-btn';

  isOpen = signal(false);
  value = signal<string>('');

  selectedLength = computed(() => (this.value() ? 1 : 0));

  ngOnInit(): void {
    if (!this.group.contains(this.field.name)) {
      this.group.addControl(this.field.name, this.fb.control(''));
    }
    const ctrl = this.group.get(this.field.name);
    if (ctrl) {
      this.value.set(ctrl.value ?? '');
      ctrl.valueChanges.subscribe(v => this.value.set(v ?? ''));
    }
  }

  toggle(): void { this.isOpen.update(v => !v); }
  close(): void { this.isOpen.set(false); }

  onClear(): void {
    this.group.get(this.field.name)?.setValue('');
    this.close();
  }
}
