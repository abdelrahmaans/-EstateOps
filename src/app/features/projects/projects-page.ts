import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';
import { toErrorMessage } from '../../core/errors';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { Project, ProjectStatus } from '../../core/models';
import { ProjectPayload, ProjectsService } from '../../core/projects.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog.service';
import { labelKey } from '../../shared/status-label';

@Component({
  selector: 'app-projects-page',
  imports: [DatePipe, ReactiveFormsModule, TranslatePipe],
  template: `
    <section class="page-header"><div><p class="eyebrow">{{ 'projects.eyebrow' | t }}</p><h2>{{ 'projects.title' | t }}</h2></div><button class="button primary" type="button" (click)="startCreate()">{{ 'projects.add' | t }}</button></section>
    <form class="filters compact-filters" [formGroup]="filters">
      <label class="filter-field">
        <span>{{ 'common.updatedAt' | t }}</span>
        <input type="date" formControlName="updatedDate" [attr.aria-label]="'common.updatedAt' | t" />
      </label>
      <button class="button ghost" type="button" (click)="clearFilters()">{{ 'common.clear' | t }}</button>
    </form>
    @if (error()) { <p class="state error" role="alert">{{ error() }}</p> }
    <div class="table-wrap"><table><thead><tr><th>{{ 'projects.name' | t }}</th><th>{{ 'projects.location' | t }}</th><th>{{ 'projects.status' | t }}</th><th>{{ 'common.createdAt' | t }}</th><th>{{ 'common.updatedAt' | t }}</th><th>{{ 'common.actions' | t }}</th></tr></thead><tbody>
      @for (project of projects(); track project.id) {
        <tr>
          <td>{{ project.name }}</td>
          <td>{{ project.location }}</td>
          <td><span class="badge">{{ statusKey(project.status) | t }}</span></td>
          <td>{{ project.created_at | date:'short' }}</td>
          <td>{{ project.updated_at | date:'short' }}</td>
          <td>
            <div class="table-actions">
              <button class="icon-button table-action" type="button" (click)="startEdit(project)" [attr.aria-label]="'common.edit' | t">✎</button>
              <button class="icon-button table-action danger-action" type="button" (click)="deleteProject(project)" [attr.aria-label]="'common.delete' | t">×</button>
            </div>
          </td>
        </tr>
      } @empty { <tr><td colspan="6" class="empty">{{ 'common.empty' | t }}</td></tr> }
    </tbody></table></div>
    @if (editing()) {
      <section class="drawer" role="dialog" aria-modal="true"><form class="form-grid" [formGroup]="form" (ngSubmit)="save()">
        <h3>{{ 'projects.formTitle' | t }}</h3>
        <label><span>{{ 'projects.name' | t }}</span><input formControlName="name" /></label>
        <label><span>{{ 'projects.location' | t }}</span><input formControlName="location" /></label>
        <label><span>{{ 'projects.status' | t }}</span><select formControlName="status">@for (status of statuses; track status) { <option [value]="status">{{ statusKey(status) | t }}</option> }</select></label>
        <label class="span-2"><span>{{ 'projects.description' | t }}</span><textarea formControlName="description"></textarea></label>
        <div class="form-actions span-2"><button class="button" type="button" (click)="cancel()">{{ 'common.cancel' | t }}</button><button class="button primary" type="submit">{{ 'common.save' | t }}</button></div>
      </form></section>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsPage {
  private readonly service = inject(ProjectsService);
  private readonly fb = inject(FormBuilder);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly projects = signal<Project[]>([]);
  protected readonly editing = signal<Project | 'new' | null>(null);
  protected readonly error = signal('');
  protected readonly statuses: ProjectStatus[] = ['planning', 'active', 'completed', 'paused'];
  protected readonly filters = this.fb.nonNullable.group({ updatedDate: '' });
  protected readonly form = this.fb.nonNullable.group({ name: '', location: '', description: '', status: 'active' as ProjectStatus });

  constructor() {
    this.filters.valueChanges
      .pipe(debounceTime(250), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => void this.load());
    void this.load();
  }
  protected async load(): Promise<void> { try { const raw = this.filters.getRawValue(); this.projects.set(await this.service.list({ updatedDate: raw.updatedDate })); } catch (error) { this.error.set(toErrorMessage(error)); } }
  protected startCreate(): void { this.editing.set('new'); this.form.reset({ name: '', location: '', description: '', status: 'active' }); }
  protected startEdit(project: Project): void { this.editing.set(project); this.form.setValue({ name: project.name, location: project.location, description: project.description ?? '', status: project.status }); }
  protected async save(): Promise<void> {
    const raw = this.form.getRawValue();
    const payload: ProjectPayload = { ...raw, description: raw.description || null };
    try { const editing = this.editing(); if (editing === 'new') { await this.service.create(payload); } else if (editing) { await this.service.update(editing.id, payload); } this.cancel(); await this.load(); } catch (error) { this.error.set(toErrorMessage(error)); }
  }
  protected async deleteProject(project: Project): Promise<void> {
    if (!await this.confirmDialog.confirm()) {
      return;
    }

    try {
      await this.service.remove(project.id);
      await this.load();
    } catch (error) {
      this.error.set(toErrorMessage(error));
    }
  }
  protected clearFilters(): void { this.filters.reset({ updatedDate: '' }, { emitEvent: false }); void this.load(); }
  protected cancel(): void { this.editing.set(null); }
  protected statusKey(status: string): string { return labelKey('projectStatuses', status); }
}
