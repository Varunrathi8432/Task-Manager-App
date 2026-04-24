export type FilterFieldType = 'text' | 'dropdown' | 'date' | 'ngdaterange';

export interface FilterOption {
  id: string | number;
  name: string;
  color?: string;
}

export interface FilterField {
  id: string;
  name: string;
  label: string;
  field_type: FilterFieldType;

  isMultiple?: boolean;
  items?: FilterOption[];
  placeholder?: string;

  showRemove?: boolean;
  isQuickFilter?: boolean;
  order?: number;
}

export interface DateRangeValue {
  start: string | null;
  end: string | null;
}

export type FilterFormData = Record<string, unknown>;

export interface FilterSubmitEvent {
  filterFormData: FilterFormData;
  queryParams: string;
}

export interface FilterComponentApi {
  selectedLength: number;
  isOpen?: boolean;
}
