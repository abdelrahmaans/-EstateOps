import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { canAccess } from '../../core/roles';
import { LanguageSwitcher } from '../../shared/components/language-switcher/language-switcher';
import { ThemeToggle } from '../../shared/components/theme-toggle/theme-toggle';

interface NavItem {
  path: string;
  labelKey: string;
  area: 'salesData' | 'leads' | 'tasks' | 'settings';
}

@Component({
  selector: 'app-shell',
  imports: [NgOptimizedImage, RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe, LanguageSwitcher, ThemeToggle],
  template: `
    <div class="app-shell" [class.sidebar-open]="sidebarOpen()">
      <aside class="sidebar" [attr.aria-label]="'layout.sidebar' | t">
        <a class="brand" routerLink="/">
          <img class="brand-mark" ngSrc="assets/brand/future-line-logo.jpg" width="52" height="52" alt="" priority />
          <span>
            <strong>{{ 'layout.brand' | t }}</strong>
            <small>{{ 'layout.subtitle' | t }}</small>
          </span>
        </a>

        <nav class="nav-list">
          @for (item of visibleNav(); track item.path) {
            <a [routerLink]="item.path" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: item.path === '/' }">
              {{ item.labelKey | t }}
            </a>
          }
        </nav>
      </aside>

      <div class="shell-main">
        <header class="topbar">
          <button class="icon-button mobile-menu" type="button" (click)="toggleSidebar()" [attr.aria-label]="'layout.menu' | t">☰</button>
          <div>
            <p class="eyebrow">{{ 'layout.workspace' | t }}</p>
            <h1>{{ currentTitle() | t }}</h1>
          </div>
          <div class="topbar-actions">
            <app-language-switcher />
            <app-theme-toggle />
            <span class="user-chip">{{ auth.profile()?.full_name ?? ('auth.user' | t) }}</span>
            <button class="button ghost" type="button" (click)="logout()">{{ 'auth.logout' | t }}</button>
          </div>
        </header>

        <main class="page-content" (click)="closeSidebar()">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShell {
  protected readonly auth = inject(AuthService);
  protected readonly i18n = inject(I18nService);
  protected readonly sidebarOpen = signal(false);

  private readonly navItems: NavItem[] = [
    { path: '/', labelKey: 'nav.dashboard', area: 'salesData' },
    { path: '/leads', labelKey: 'nav.leads', area: 'leads' },
    { path: '/broker-clients', labelKey: 'nav.brokerClients', area: 'leads' },
    { path: '/projects', labelKey: 'nav.projects', area: 'salesData' },
    { path: '/units', labelKey: 'nav.units', area: 'salesData' },
  ];

  protected readonly visibleNav = computed(() => {
    const role = this.auth.profile()?.role ?? null;
    return this.navItems.filter((item) => canAccess(role, item.area));
  });

  protected readonly currentTitle = computed(() => {
    const path = location.pathname;
    const current = this.navItems.find((item) => item.path !== '/' && path.startsWith(item.path));
    return current?.labelKey ?? 'nav.dashboard';
  });

  protected toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  protected closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  protected async logout(): Promise<void> {
    await this.auth.logout();
  }
}
