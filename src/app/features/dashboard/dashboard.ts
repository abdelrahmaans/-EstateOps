import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DashboardService } from '../../core/dashboard.service';
import { toErrorMessage } from '../../core/errors';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { DashboardStats } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  imports: [TranslatePipe],
  template: `
    <section class="page-header">
      <div>
        <p class="eyebrow">{{ 'dashboard.eyebrow' | t }}</p>
        <h2>{{ 'dashboard.title' | t }}</h2>
      </div>
    </section>

    @if (error()) {
      <p class="state error" role="alert">{{ error() }}</p>
    }

    <section class="metric-grid" [attr.aria-label]="'dashboard.metrics' | t">
      @for (card of cards(); track card.key) {
        <article class="metric-card">
          <span>{{ card.label | t }}</span>
          <strong>{{ card.value }}</strong>
        </article>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly dashboard = inject(DashboardService);
  protected readonly stats = signal<DashboardStats>({
    totalLeads: 0,
    newLeads: 0,
    followUpsToday: 0,
    overdueFollowUps: 0,
    availableUnits: 0,
    reservedUnits: 0,
    soldUnits: 0,
    totalTasks: 0,
  });
  protected readonly error = signal('');

  constructor() {
    void this.load();
  }

  protected cards(): Array<{ key: keyof DashboardStats; label: string; value: number }> {
    const stats = this.stats();
    return [
      { key: 'totalLeads', label: 'dashboard.totalLeads', value: stats.totalLeads },
      { key: 'newLeads', label: 'dashboard.newLeads', value: stats.newLeads },
      { key: 'followUpsToday', label: 'dashboard.followUpsToday', value: stats.followUpsToday },
      { key: 'overdueFollowUps', label: 'dashboard.overdueFollowUps', value: stats.overdueFollowUps },
      { key: 'availableUnits', label: 'dashboard.availableUnits', value: stats.availableUnits },
      { key: 'reservedUnits', label: 'dashboard.reservedUnits', value: stats.reservedUnits },
      { key: 'soldUnits', label: 'dashboard.soldUnits', value: stats.soldUnits },
      { key: 'totalTasks', label: 'dashboard.totalTasks', value: stats.totalTasks },
    ];
  }

  private async load(): Promise<void> {
    try {
      this.stats.set(await this.dashboard.stats());
    } catch (error) {
      this.error.set(toErrorMessage(error));
    }
  }
}
