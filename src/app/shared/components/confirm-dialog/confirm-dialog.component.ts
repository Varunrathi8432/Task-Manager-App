import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  warn?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  bsModalRef = inject(BsModalRef);

  title = '';
  message = '';
  confirmText?: string;
  cancelText?: string;
  warn = false;

  readonly result = new Subject<boolean>();

  onConfirm(): void {
    this.result.next(true);
    this.bsModalRef.hide();
  }

  onCancel(): void {
    this.result.next(false);
    this.bsModalRef.hide();
  }
}
