import {
  Component,
  ChangeDetectionStrategy,
  Input,
  OnInit,
  HostBinding,
  signal,
  computed,
  inject,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { OverlayModule } from '@angular/cdk/overlay';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { FilterField } from '../../dynamic-filter.types';

@Component({
  selector: 'app-text-filter',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    OverlayModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './text-filter.component.html',
  styleUrl: './text-filter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextFilterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  @Input({ required: true }) group!: FormGroup;
  @Input({ required: true }) field!: FilterField;
  @HostBinding('attr.id') get hostId() {
    return this.field?.id;
  }
  @HostBinding('class') hostClass = 'app-btn';

  isOpen = signal(false);
  inputValue = signal('');

  selectedLength = computed(() => (this.inputValue() ? 1 : 0));

  ngOnInit(): void {
    if (!this.group.contains(this.field.name)) {
      this.group.addControl(this.field.name, this.fb.control(''));
    }
    const ctrl = this.group.get(this.field.name);
    if (ctrl) {
      this.inputValue.set(ctrl.value ?? '');
      ctrl.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((v) => this.inputValue.set(v ?? ''));
    }
  }

  toggle(): void {
    this.isOpen.update((v) => !v);
  }

  close(): void {
    this.isOpen.set(false);
  }

  onClear(): void {
    this.group.get(this.field.name)?.setValue('');
    this.close();
  }
}
