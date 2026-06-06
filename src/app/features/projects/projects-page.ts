import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { toErrorMessage } from '../../core/errors';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { Project, ProjectStatus } from '../../core/models';
import { ProjectPayload, ProjectsService } from '../../core/projects.service';
import { labelKey } from '../../shared/status-label';

@Component({
  selector: 'app-projects-page',
  imports: [ReactiveFormsModule, TranslatePipe],
  template: `
    <section class="page-header"><div><p class="eyebrow">{{ 'projects.eyebrow' | t }}</p><h2>{{ 'projects.title' | t }}</h2></div><button class="button primary" type="button" (click)="startCreate()">{{ 'projects.add' | t }}</button></section>
    @if (error()) { <p class="state error" role="alert">{{ error() }}</p> }
    <div class="table-wrap"><table><thead><tr><th>{{ 'projects.name' | t }}</th><th>{{ 'projects.location' | t }}</th><th>{{ 'projects.status' | t }}</th><th>{{ 'common.actions' | t }}</th></tr></thead><tbody>
      @for (project of projects(); track project.id) {
        <tr><td>{{ project.name }}</td><td>{{ project.location }}</td><td><span class="badge">{{ statusKey(project.status) | t }}</span></td><td><button class="link-button" type="button" (click)="startEdit(project)">{{ 'common.edit' | t }}</button></td></tr>
      } @empty { <tr><td colspan="4" class="empty">{{ 'common.empty' | t }}</td></tr> }
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
  protected readonly projects = signal<Project[]>([]);
  protected readonly editing = signal<Project | 'new' | null>(null);
  protected readonly error = signal('');
  protected readonly statuses: ProjectStatus[] = ['planning', 'active', 'completed', 'paused'];
  protected readonly form = this.fb.nonNullable.group({ name: '', location: '', description: '', status: 'active' as ProjectStatus });

  constructor() { void this.load(); }
  protected async load(): Promise<void> { try { this.projects.set(await this.service.list()); } catch (error) { this.error.set(toErrorMessage(error)); } }
  protected startCreate(): void { this.editing.set('new'); this.form.reset({ name: '', location: '', description: '', status: 'active' }); }
  protected startEdit(project: Project): void { this.editing.set(project); this.form.setValue({ name: project.name, location: project.location, description: project.description ?? '', status: project.status }); }
  protected async save(): Promise<void> {
    const raw = this.form.getRawValue();
    const payload: ProjectPayload = { ...raw, description: raw.description || null };
    try { const editing = this.editing(); if (editing === 'new') { await this.service.create(payload); } else if (editing) { await this.service.update(editing.id, payload); } this.cancel(); await this.load(); } catch (error) { this.error.set(toErrorMessage(error)); }
  }
  protected cancel(): void { this.editing.set(null); }
  protected statusKey(status: string): string { return labelKey('projectStatuses', status); }
}
