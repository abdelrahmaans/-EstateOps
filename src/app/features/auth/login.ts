import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { toErrorMessage } from '../../core/errors';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { LanguageSwitcher } from '../../shared/components/language-switcher/language-switcher';
import { ThemeToggle } from '../../shared/components/theme-toggle/theme-toggle';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, TranslatePipe, LanguageSwitcher, ThemeToggle],
  template: `
    <main class="auth-page">
      <section class="auth-panel" aria-labelledby="loginTitle">
        <div class="auth-toolbar">
          <app-language-switcher />
          <app-theme-toggle />
        </div>
        <div class="brand auth-brand">
          <span class="brand-mark" aria-hidden="true">FL</span>
          <span>
            <strong>{{ 'layout.brand' | t }}</strong>
            <small>{{ 'layout.subtitle' | t }}</small>
          </span>
        </div>
        <h1 id="loginTitle">{{ 'auth.loginTitle' | t }}</h1>
        <p>{{ 'auth.loginSubtitle' | t }}</p>

        <form [formGroup]="form" (ngSubmit)="submit()" class="form-stack">
          <label>
            <span>{{ 'auth.email' | t }}</span>
            <input type="email" formControlName="email" autocomplete="email" />
          </label>
          <label>
            <span>{{ 'auth.password' | t }}</span>
            <input type="password" formControlName="password" autocomplete="current-password" />
          </label>

          @if (error()) {
            <p class="form-error" role="alert">{{ error() }}</p>
          }

          <button class="button primary" type="submit" [disabled]="form.invalid || submitting()">
            {{ submitting() ? ('common.loading' | t) : ('auth.signIn' | t) }}
          </button>
        </form>
      </section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly submitting = signal(false);
  protected readonly error = signal('');

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    this.submitting.set(true);
    this.error.set('');

    try {
      const { email, password } = this.form.getRawValue();
      await this.auth.login(email, password);
      await this.router.navigate(['/']);
    } catch (error) {
      this.error.set(toErrorMessage(error));
    } finally {
      this.submitting.set(false);
    }
  }
}
