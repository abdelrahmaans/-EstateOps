import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-language-switcher',
  imports: [TranslatePipe],
  template: `
    <button class="icon-button text-button" type="button" (click)="i18n.toggleLanguage()" [attr.aria-label]="'common.language' | t">
      {{ i18n.language() === 'en' ? 'العربية' : 'English' }}
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSwitcher {
  protected readonly i18n = inject(I18nService);
}
