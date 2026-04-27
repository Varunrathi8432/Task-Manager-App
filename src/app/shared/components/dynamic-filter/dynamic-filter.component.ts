import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  output,
  signal,
  computed,
  effect,
  OnInit,
  OnDestroy,
  AfterViewInit,
} from '@angular/core';
import { FormGroup, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { OverlayModule } from '@angular/cdk/overlay';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, debounceTime, takeUntil } from 'rxjs';

import { TextFilterComponent } from './components/text-filter/text-filter.component';
import { DropdownFilterComponent } from './components/dropdown-filter/dropdown-filter.component';
import { DateFilterComponent } from './components/date-filter/date-filter.component';
import { DateRangeFilterComponent } from './components/date-range-filter/date-range-filter.component';
import { DynamicFilterService } from './dynamic-filter.service';
import type {
  FilterField,
  FilterFormData,
  FilterSubmitEvent,
} from './dynamic-filter.types';

interface StoredFilterEntry {
  filterFormData?: FilterFormData;
  hiddenFilters?: string[];
}

const FILTER_STORAGE_ROOT_KEY = 'filter_store';

@Component({
  selector: 'app-dynamic-filter',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    OverlayModule,
    MatIconModule,
    MatTooltipModule,
    TextFilterComponent,
    DropdownFilterComponent,
    DateFilterComponent,
    DateRangeFilterComponent,
  ],
  templateUrl: './dynamic-filter.component.html',
  styleUrl: './dynamic-filter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicFilterComponent implements OnInit, OnDestroy, AfterViewInit {
  private fb = inject(FormBuilder);
  private filterService = inject(DynamicFilterService);

  fieldsArray = input.required<FilterField[]>();
  filterFormData = input<FilterFormData>({});
  isStaticFilter = input<boolean>(false);
  isLineView = input<boolean>(false);
  localStorageKey = input<string | undefined>(undefined);

  whenFilterSubmit = output<FilterSubmitEvent>();

  filterForm: FormGroup = this.fb.group({});

  hiddenFilters = signal<Set<string>>(new Set());
  pickerOpen = signal(false);
  formValue = signal<FilterFormData>({});

  visibleFields = computed(() => {
    const hidden = this.hiddenFilters();
    return this.fieldsArray()
      .filter(f => !hidden.has(f.id))
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  });

  pickerList = computed(() => {
    const hidden = this.hiddenFilters();
    return this.fieldsArray().filter(f => hidden.has(f.id));
  });

  isFilterEmpty = computed(() => this.filterService.isEmpty(this.formValue(), this.fieldsArray()));

  private destroy$ = new Subject<void>();
  private pendingStoredFormData: FilterFormData | null = null;

  constructor() {
    effect(() => {
      const data = this.filterFormData();
      if (!data) return;
      Object.entries(data).forEach(([key, value]) => {
        const ctrl = this.filterForm.get(key);
        if (ctrl && ctrl.value !== value) {
          ctrl.setValue(value, { emitEvent: false });
        }
      });
      this.formValue.set({ ...this.filterForm.getRawValue() });
    });
  }

  ngOnInit(): void {
    this.loadFromLocalStorage();
    this.filterForm.valueChanges
      .pipe(debounceTime(150), takeUntil(this.destroy$))
      .subscribe(() => this.submitFilter());
  }

  ngAfterViewInit(): void {
    if (!this.pendingStoredFormData) return;
    Object.entries(this.pendingStoredFormData).forEach(([key, value]) => {
      const ctrl = this.filterForm.get(key);
      if (ctrl) ctrl.setValue(value);
    });
    this.pendingStoredFormData = null;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  submitFilter(): void {
    const formValue = this.filterForm.getRawValue() as FilterFormData;
    this.formValue.set({ ...formValue });
    const queryParams = this.filterService.buildQueryParams(formValue, this.fieldsArray());
    this.whenFilterSubmit.emit({ filterFormData: formValue, queryParams });
    this.saveToLocalStorage();
  }

  resetFilter(): void {
    this.filterForm.reset();
    this.fieldsArray().forEach(f => {
      const ctrl = this.filterForm.get(f.name);
      if (!ctrl) return;
      if (f.field_type === 'dropdown' && f.isMultiple) ctrl.setValue([]);
      else if (f.field_type === 'ngdaterange') ctrl.setValue({ start: null, end: null });
      else ctrl.setValue(null);
    });
  }

  swapFilter(filterId: string): void {
    this.hiddenFilters.update(set => {
      const next = new Set(set);
      next.delete(filterId);
      return next;
    });
    this.pickerOpen.set(false);
    this.saveToLocalStorage();
  }

  hideFilter(filterId: string): void {
    this.hiddenFilters.update(set => {
      const next = new Set(set);
      next.add(filterId);
      return next;
    });
    this.saveToLocalStorage();
  }

  togglePicker(): void { this.pickerOpen.update(v => !v); }
  closePicker(): void { this.pickerOpen.set(false); }

  private loadFromLocalStorage(): void {
    const key = this.localStorageKey();
    if (!key) return;
    try {
      const raw = localStorage.getItem(FILTER_STORAGE_ROOT_KEY);
      if (!raw) return;
      const store = JSON.parse(raw) as Record<string, StoredFilterEntry>;
      const saved = store[key];
      if (!saved) return;
      if (saved.hiddenFilters?.length) {
        this.hiddenFilters.set(new Set(saved.hiddenFilters));
      }
      if (saved.filterFormData) {
        this.pendingStoredFormData = saved.filterFormData;
      }
    } catch {}
  }

  private saveToLocalStorage(): void {
    const key = this.localStorageKey();
    if (!key) return;
    try {
      const raw = localStorage.getItem(FILTER_STORAGE_ROOT_KEY);
      const store = (raw ? JSON.parse(raw) : {}) as Record<string, StoredFilterEntry>;
      store[key] = {
        filterFormData: this.formValue(),
        hiddenFilters: Array.from(this.hiddenFilters()),
      };
      localStorage.setItem(FILTER_STORAGE_ROOT_KEY, JSON.stringify(store));
    } catch {}
  }
}
