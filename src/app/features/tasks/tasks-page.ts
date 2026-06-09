import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';
import { toErrorMessage } from '../../core/errors';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { Lead, Profile, Task, TaskPriority, TaskStatus } from '../../core/models';
import { LeadsService } from '../../core/leads.service';
import { TaskPayload, TasksService } from '../../core/tasks.service';
import { UsersService } from '../../core/users.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog.service';
import { labelKey } from '../../shared/status-label';

@Component({
  selector: 'app-tasks-page',
  imports: [DatePipe, ReactiveFormsModule, TranslatePipe],
  template: `
    <section class="page-header"><div><p class="eyebrow">{{ 'tasks.eyebrow' | t }}</p><h2>{{ 'tasks.title' | t }}</h2></div><button class="button primary" type="button" (click)="startCreate()">{{ 'tasks.add' | t }}</button></section>
    <form class="filters compact-filters" [formGroup]="filters">
      <label class="filter-field">
        <span>{{ 'common.updatedAt' | t }}</span>
        <input type="date" formControlName="updatedDate" [attr.aria-label]="'common.updatedAt' | t" />
      </label>
      <button class="button ghost" type="button" (click)="clearFilters()">{{ 'common.clear' | t }}</button>
    </form>
    @if (error()) { <p class="state error" role="alert">{{ error() }}</p> }
    <div class="table-wrap"><table><thead><tr><th>{{ 'tasks.titleField' | t }}</th><th>{{ 'tasks.createdBy' | t }}</th><th>{{ 'tasks.assignedTo' | t }}</th><th>{{ 'tasks.lead' | t }}</th><th>{{ 'tasks.dueDate' | t }}</th><th>{{ 'tasks.priority' | t }}</th><th>{{ 'tasks.status' | t }}</th><th>{{ 'common.createdAt' | t }}</th><th>{{ 'common.updatedAt' | t }}</th><th>{{ 'common.actions' | t }}</th></tr></thead><tbody>
      @for (task of tasks(); track task.id) {
        <tr><td>{{ task.title }}</td><td>{{ task.creator?.full_name ?? ('common.none' | t) }}</td><td>{{ task.assignee?.full_name ?? ('common.unassigned' | t) }}</td><td>{{ task.lead?.name ?? ('common.none' | t) }}</td><td>{{ task.due_date ?? ('common.none' | t) }}</td><td><span class="badge">{{ priorityKey(task.priority) | t }}</span></td><td><span class="badge" [class]="task.status">{{ statusKey(task.status) | t }}</span></td><td>{{ task.created_at | date:'short' }}</td><td>{{ task.updated_at | date:'short' }}</td><td><div class="table-actions"><button class="icon-button table-action" type="button" (click)="startEdit(task)" [attr.aria-label]="'common.edit' | t">✎</button><button class="icon-button table-action danger-action" type="button" (click)="deleteTask(task)" [attr.aria-label]="'common.delete' | t">×</button></div></td></tr>
      } @empty { <tr><td colspan="10" class="empty">{{ 'common.empty' | t }}</td></tr> }
    </tbody></table></div>
    @if (editing()) {
      <section class="drawer" role="dialog" aria-modal="true"><form class="form-grid" [formGroup]="form" (ngSubmit)="save()">
        <h3>{{ 'tasks.formTitle' | t }}</h3>
        <label><span>{{ 'tasks.titleField' | t }}</span><input formControlName="title" /></label>
        <label><span>{{ 'tasks.assignedTo' | t }}</span><select formControlName="assigned_to"><option value="">{{ 'common.unassigned' | t }}</option>@for (user of users(); track user.id) { <option [value]="user.id">{{ user.full_name }}</option> }</select></label>
        <label><span>{{ 'tasks.lead' | t }}</span><select formControlName="related_lead_id"><option value="">{{ 'common.none' | t }}</option>@for (lead of leads(); track lead.id) { <option [value]="lead.id">{{ lead.name }}</option> }</select></label>
        <label><span>{{ 'tasks.dueDate' | t }}</span><input type="date" formControlName="due_date" /></label>
        <label><span>{{ 'tasks.priority' | t }}</span><select formControlName="priority">@for (priority of priorities; track priority) { <option [value]="priority">{{ priorityKey(priority) | t }}</option> }</select></label>
        <label><span>{{ 'tasks.status' | t }}</span><select formControlName="status">@for (status of statuses; track status) { <option [value]="status">{{ statusKey(status) | t }}</option> }</select></label>
        <label class="span-2"><span>{{ 'tasks.description' | t }}</span><textarea formControlName="description"></textarea></label>
        <div class="form-actions span-2"><button class="button" type="button" (click)="cancel()">{{ 'common.cancel' | t }}</button><button class="button primary" type="submit">{{ 'common.save' | t }}</button></div>
      </form></section>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasksPage {
  private readonly service = inject(TasksService);
  private readonly usersService = inject(UsersService);
  private readonly leadsService = inject(LeadsService);
  private readonly fb = inject(FormBuilder);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly tasks = signal<Task[]>([]);
  protected readonly users = signal<Profile[]>([]);
  protected readonly leads = signal<Lead[]>([]);
  protected readonly editing = signal<Task | 'new' | null>(null);
  protected readonly error = signal('');
  protected readonly statuses: TaskStatus[] = ['pending', 'in_progress', 'done', 'cancelled'];
  protected readonly priorities: TaskPriority[] = ['low', 'medium', 'high'];
  protected readonly filters = this.fb.nonNullable.group({ updatedDate: '' });
  protected readonly form = this.fb.nonNullable.group({ title: '', description: '', assigned_to: '', related_lead_id: '', due_date: '', priority: 'medium' as TaskPriority, status: 'pending' as TaskStatus });
  constructor() {
    this.filters.valueChanges
      .pipe(debounceTime(250), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => void this.load());
    void this.loadSupport();
    void this.load();
  }
  protected async load(): Promise<void> { try { const raw = this.filters.getRawValue(); this.tasks.set(await this.service.list({ updatedDate: raw.updatedDate })); } catch (error) { this.error.set(toErrorMessage(error)); } }
  protected startCreate(): void { this.editing.set('new'); this.form.reset({ title: '', description: '', assigned_to: '', related_lead_id: '', due_date: '', priority: 'medium', status: 'pending' }); }
  protected startEdit(task: Task): void { this.editing.set(task); this.form.setValue({ title: task.title, description: task.description ?? '', assigned_to: task.assigned_to ?? '', related_lead_id: task.related_lead_id ?? '', due_date: task.due_date ?? '', priority: task.priority, status: task.status }); }
  protected async save(): Promise<void> { const raw = this.form.getRawValue(); const payload: TaskPayload = { ...raw, description: raw.description || null, assigned_to: raw.assigned_to || null, related_lead_id: raw.related_lead_id || null, due_date: raw.due_date || null }; try { const editing = this.editing(); if (editing === 'new') { await this.service.create(payload); } else if (editing) { await this.service.update(editing.id, payload); } this.cancel(); await this.load(); } catch (error) { this.error.set(toErrorMessage(error)); } }
  protected async deleteTask(task: Task): Promise<void> {
    if (!await this.confirmDialog.confirm()) {
      return;
    }

    try {
      await this.service.remove(task.id);
      await this.load();
    } catch (error) {
      this.error.set(toErrorMessage(error));
    }
  }
  protected clearFilters(): void { this.filters.reset({ updatedDate: '' }, { emitEvent: false }); void this.load(); }
  protected cancel(): void { this.editing.set(null); }
  protected statusKey(status: string): string { return labelKey('taskStatuses', status); }
  protected priorityKey(priority: string): string { return labelKey('priorities', priority); }
  private async loadSupport(): Promise<void> { const [users, leads] = await Promise.all([this.usersService.list(), this.leadsService.list()]); this.users.set(users); this.leads.set(leads); }
}
