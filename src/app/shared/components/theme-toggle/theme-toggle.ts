import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { ThemeService } from '../../../core/theme/theme.service';

@Component({
  selector: 'app-theme-toggle',
  imports: [TranslatePipe],
  template: `
    <button class="icon-button" type="button" (click)="theme.toggleTheme()" [attr.aria-label]="'common.theme' | t">
      <span aria-hidden="true">{{ theme.theme() === 'dark' ? '☀' : '◐' }}</span>
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeToggle {
  protected readonly theme = inject(ThemeService);
}
