import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';

export type AppLanguage = 'en' | 'ar';
type Dictionary = Record<string, unknown>;

const fallbackDictionary: Record<AppLanguage, Dictionary> = {
  en: {},
  ar: {},
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);
  private readonly dictionaries = signal<Record<AppLanguage, Dictionary>>(fallbackDictionary);
  readonly language = signal<AppLanguage>(this.readLanguage());
  readonly direction = computed(() => (this.language() === 'ar' ? 'rtl' : 'ltr'));

  constructor() {
    this.loadLanguage('en');
    this.loadLanguage('ar');

    effect(() => {
      const language = this.language();
      localStorage.setItem('crm.language', language);
      this.document.documentElement.lang = language;
      this.document.documentElement.dir = this.direction();
    });
  }

  setLanguage(language: AppLanguage): void {
    this.language.set(language);
  }

  toggleLanguage(): void {
    this.setLanguage(this.language() === 'en' ? 'ar' : 'en');
  }

  t(key: string): string {
    const value = this.resolve(this.dictionaries()[this.language()], key);
    if (typeof value === 'string') {
      return value;
    }

    const fallback = this.resolve(this.dictionaries().en, key);
    return typeof fallback === 'string' ? fallback : key;
  }

  private loadLanguage(language: AppLanguage): void {
    this.http.get<Dictionary>(`/assets/i18n/${language}.json`).subscribe({
      next: (dictionary) => {
        this.dictionaries.update((current) => ({ ...current, [language]: dictionary }));
      },
    });
  }

  private resolve(dictionary: Dictionary, key: string): unknown {
    return key.split('.').reduce<unknown>((current, part) => {
      if (typeof current === 'object' && current !== null && part in current) {
        return (current as Record<string, unknown>)[part];
      }

      return undefined;
    }, dictionary);
  }

  private readLanguage(): AppLanguage {
    return localStorage.getItem('crm.language') === 'ar' ? 'ar' : 'en';
  }
}
