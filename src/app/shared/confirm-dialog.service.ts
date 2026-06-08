import { Injectable, signal } from '@angular/core';

interface ConfirmDialogState {
  titleKey: string;
  messageKey: string;
  confirmKey: string;
  cancelKey: string;
  resolve: (confirmed: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  readonly state = signal<ConfirmDialogState | null>(null);

  confirm(messageKey = 'common.confirmDelete', titleKey = 'common.confirmTitle'): Promise<boolean> {
    return new Promise((resolve) => {
      this.state.set({
        titleKey,
        messageKey,
        confirmKey: 'common.delete',
        cancelKey: 'common.cancel',
        resolve,
      });
    });
  }

  close(confirmed: boolean): void {
    const current = this.state();
    if (!current) {
      return;
    }

    current.resolve(confirmed);
    this.state.set(null);
  }
}
