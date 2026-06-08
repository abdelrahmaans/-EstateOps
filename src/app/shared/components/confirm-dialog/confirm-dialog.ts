import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { ConfirmDialogService } from '../../confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  imports: [TranslatePipe],
  template: `
    @if (confirmDialog.state(); as dialog) {
      <section class="confirm-backdrop" role="presentation" (click)="cancel()" (keydown.escape)="cancel()">
        <article
          class="confirm-card"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="'confirmTitle'"
          [attr.aria-describedby]="'confirmMessage'"
          (click)="$event.stopPropagation()"
        >
          <h2 id="confirmTitle">{{ dialog.titleKey | t }}</h2>
          <p id="confirmMessage">{{ dialog.messageKey | t }}</p>
          <div class="confirm-actions">
            <button class="button" type="button" (click)="cancel()">{{ dialog.cancelKey | t }}</button>
            <button class="button danger-button" type="button" (click)="confirm()" autofocus>{{ dialog.confirmKey | t }}</button>
          </div>
        </article>
      </section>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialog {
  protected readonly confirmDialog = inject(ConfirmDialogService);

  protected confirm(): void {
    this.confirmDialog.close(true);
  }

  protected cancel(): void {
    this.confirmDialog.close(false);
  }
}
