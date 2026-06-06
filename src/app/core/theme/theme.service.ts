import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';

export type AppTheme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  readonly theme = signal<AppTheme>(this.readTheme());

  constructor() {
    effect(() => {
      const theme = this.theme();
      localStorage.setItem('crm.theme', theme);
      this.document.documentElement.dataset['theme'] = theme;
    });
  }

  toggleTheme(): void {
    this.theme.update((theme) => (theme === 'light' ? 'dark' : 'light'));
  }

  private readTheme(): AppTheme {
    return localStorage.getItem('crm.theme') === 'dark' ? 'dark' : 'light';
  }
}
