import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toErrorMessage } from '../../core/errors';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { Lead, Task } from '../../core/models';
import { LeadsService } from '../../core/leads.service';
import { TasksService } from '../../core/tasks.service';

@Component({
  selector: 'app-calendar-page',
  imports: [TranslatePipe],
  template: `
    <section class="page-header"><div><p class="eyebrow">{{ 'calendar.eyebrow' | t }}</p><h2>{{ 'calendar.title' | t }}</h2></div></section>
    @if (error()) { <p class="state error" role="alert">{{ error() }}</p> }
    <section class="calendar-grid">
      @for (group of groups(); track group.key) {
        <article class="panel">
          <h3>{{ group.title | t }}</h3>
          <ul class="stack-list">
            @for (item of group.items; track item.id) {
              <li><strong>{{ item.title }}</strong><span>{{ item.date ?? ('common.none' | t) }}</span></li>
            } @empty {
              <li class="empty">{{ 'common.empty' | t }}</li>
            }
          </ul>
        </article>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarPage {
  private readonly leadsService = inject(LeadsService);
  private readonly tasksService = inject(TasksService);
  private readonly leads = signal<Lead[]>([]);
  private readonly tasks = signal<Task[]>([]);
  protected readonly error = signal('');
  private readonly today = new Date().toISOString().slice(0, 10);
  protected readonly groups = computed(() => {
    const leads = this.leads();
    const tasks = this.tasks();
    return [
      { key: 'today', title: 'calendar.todayFollowUps', items: leads.filter((lead) => lead.next_follow_up_date === this.today).map((lead) => ({ id: lead.id, title: lead.name, date: lead.next_follow_up_date })) },
      { key: 'upcoming', title: 'calendar.upcomingFollowUps', items: leads.filter((lead) => lead.next_follow_up_date !== null && lead.next_follow_up_date > this.today).map((lead) => ({ id: lead.id, title: lead.name, date: lead.next_follow_up_date })) },
      { key: 'overdue', title: 'calendar.overdueFollowUps', items: leads.filter((lead) => lead.next_follow_up_date !== null && lead.next_follow_up_date < this.today).map((lead) => ({ id: lead.id, title: lead.name, date: lead.next_follow_up_date })) },
      { key: 'tasks', title: 'calendar.tasksByDueDate', items: tasks.map((task) => ({ id: task.id, title: task.title, date: task.due_date })) },
    ];
  });

  constructor() { void this.load(); }
  private async load(): Promise<void> {
    try { const [leads, tasks] = await Promise.all([this.leadsService.list(), this.tasksService.list()]); this.leads.set(leads); this.tasks.set(tasks); } catch (error) { this.error.set(toErrorMessage(error)); }
  }
}
