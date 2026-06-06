import { ChangeDetectorRef, Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from './i18n.service';

@Pipe({
  name: 't',
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);
  private readonly cdr = inject(ChangeDetectorRef);
  private lastLanguage = this.i18n.language();

  transform(key: string): string {
    const language = this.i18n.language();
    if (language !== this.lastLanguage) {
      this.lastLanguage = language;
      this.cdr.markForCheck();
    }

    return this.i18n.t(key);
  }
}
