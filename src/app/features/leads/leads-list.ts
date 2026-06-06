import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { toErrorMessage } from '../../core/errors';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { Lead, LeadSource, LeadStatus, Profile, Project } from '../../core/models';
import { LeadPayload, LeadsService } from '../../core/leads.service';
import { ProjectsService } from '../../core/projects.service';
import { UsersService } from '../../core/users.service';
import { labelKey } from '../../shared/status-label';

@Component({
  selector: 'app-leads-list',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <section class="page-header">
      <div>
        <p class="eyebrow">{{ 'leads.eyebrow' | t }}</p>
        <h2>{{ 'leads.title' | t }}</h2>
      </div>
      <button class="button primary" type="button" (click)="startCreate()">{{ 'leads.add' | t }}</button>
    </section>

    <form class="filters" [formGroup]="filters" (ngSubmit)="load()">
      <select formControlName="status" [attr.aria-label]="'leads.status' | t">
        <option value="">{{ 'common.allStatuses' | t }}</option>
        @for (status of leadStatuses; track status) { <option [value]="status">{{ statusKey(status) | t }}</option> }
      </select>
      <select formControlName="source" [attr.aria-label]="'leads.source' | t">
        <option value="">{{ 'common.allSources' | t }}</option>
        @for (source of leadSources; track source) { <option [value]="source">{{ sourceKey(source) | t }}</option> }
      </select>
      <select formControlName="projectId" [attr.aria-label]="'leads.project' | t">
        <option value="">{{ 'common.allProjects' | t }}</option>
        @for (project of projects(); track project.id) { <option [value]="project.id">{{ project.name }}</option> }
      </select>
      <select formControlName="assignedTo" [attr.aria-label]="'leads.assignedTo' | t">
        <option value="">{{ 'common.allUsers' | t }}</option>
        @for (user of users(); track user.id) { <option [value]="user.id">{{ user.full_name }}</option> }
      </select>
      <button class="button" type="submit">{{ 'common.filter' | t }}</button>
    </form>

    @if (error()) { <p class="state error" role="alert">{{ error() }}</p> }

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{{ 'leads.name' | t }}</th>
            <th>{{ 'leads.phone' | t }}</th>
            <th>{{ 'leads.project' | t }}</th>
            <th>{{ 'leads.status' | t }}</th>
            <th>{{ 'leads.assignedTo' | t }}</th>
            <th>{{ 'leads.nextFollowUp' | t }}</th>
            <th>{{ 'common.actions' | t }}</th>
          </tr>
        </thead>
        <tbody>
          @for (lead of leads(); track lead.id) {
            <tr>
              <td><a [routerLink]="['/leads', lead.id]">{{ lead.name }}</a></td>
              <td>{{ lead.phone }}</td>
              <td>{{ lead.project?.name ?? ('common.none' | t) }}</td>
              <td><span class="badge" [class]="lead.status">{{ statusKey(lead.status) | t }}</span></td>
              <td>{{ lead.assignee?.full_name ?? ('common.unassigned' | t) }}</td>
              <td>{{ lead.next_follow_up_date ?? ('common.none' | t) }}</td>
              <td><button class="link-button" type="button" (click)="startEdit(lead)">{{ 'common.edit' | t }}</button></td>
            </tr>
          } @empty {
            <tr><td colspan="7" class="empty">{{ 'common.empty' | t }}</td></tr>
          }
        </tbody>
      </table>
    </div>

    @if (editing()) {
      <section class="drawer" role="dialog" aria-modal="true" [attr.aria-label]="'leads.formTitle' | t">
        <form [formGroup]="form" (ngSubmit)="save()" class="form-grid">
          <h3>{{ 'leads.formTitle' | t }}</h3>
          <label><span>{{ 'leads.name' | t }}</span><input formControlName="name" /></label>
          <label><span>{{ 'leads.phone' | t }}</span><input formControlName="phone" /></label>
          <label><span>{{ 'leads.email' | t }}</span><input type="email" formControlName="email" /></label>
          <label><span>{{ 'leads.source' | t }}</span><select formControlName="source">@for (source of leadSources; track source) { <option [value]="source">{{ sourceKey(source) | t }}</option> }</select></label>
          <label><span>{{ 'leads.project' | t }}</span><select formControlName="interested_project_id"><option value="">{{ 'common.none' | t }}</option>@for (project of projects(); track project.id) { <option [value]="project.id">{{ project.name }}</option> }</select></label>
          <label><span>{{ 'leads.budget' | t }}</span><input type="number" formControlName="budget" /></label>
          <label><span>{{ 'leads.status' | t }}</span><select formControlName="status">@for (status of leadStatuses; track status) { <option [value]="status">{{ statusKey(status) | t }}</option> }</select></label>
          <label><span>{{ 'leads.assignedTo' | t }}</span><select formControlName="assigned_to"><option value="">{{ 'common.unassigned' | t }}</option>@for (user of users(); track user.id) { <option [value]="user.id">{{ user.full_name }}</option> }</select></label>
          <label><span>{{ 'leads.nextFollowUp' | t }}</span><input type="date" formControlName="next_follow_up_date" /></label>
          <label class="span-2"><span>{{ 'leads.notes' | t }}</span><textarea formControlName="notes"></textarea></label>
          <div class="form-actions span-2">
            <button class="button" type="button" (click)="cancel()">{{ 'common.cancel' | t }}</button>
            <button class="button primary" type="submit" [disabled]="form.invalid">{{ 'common.save' | t }}</button>
          </div>
        </form>
      </section>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeadsList {
  private readonly fb = inject(FormBuilder);
  private readonly leadsService = inject(LeadsService);
  private readonly projectsService = inject(ProjectsService);
  private readonly usersService = inject(UsersService);
  protected readonly leads = signal<Lead[]>([]);
  protected readonly projects = signal<Project[]>([]);
  protected readonly users = signal<Profile[]>([]);
  protected readonly editing = signal<Lead | 'new' | null>(null);
  protected readonly error = signal('');
  protected readonly leadStatuses: LeadStatus[] = ['new', 'contacted', 'follow_up', 'site_visit', 'negotiation', 'reserved', 'contracted', 'lost'];
  protected readonly leadSources: LeadSource[] = ['facebook', 'website', 'referral', 'walk_in', 'campaign', 'other'];

  protected readonly filters = this.fb.nonNullable.group({ status: '', source: '', projectId: '', assignedTo: '' });
  protected readonly form = this.fb.nonNullable.group({
    name: '',
    phone: '',
    email: '',
    source: 'facebook' as LeadSource,
    interested_project_id: '',
    budget: 0,
    status: 'new' as LeadStatus,
    assigned_to: '',
    notes: '',
    next_follow_up_date: '',
  });

  constructor() {
    void this.loadSupport();
    void this.load();
  }

  protected async load(): Promise<void> {
    try {
      const raw = this.filters.getRawValue();
      this.leads.set(await this.leadsService.list({
        status: raw.status as LeadStatus | '',
        source: raw.source as LeadSource | '',
        projectId: raw.projectId,
        assignedTo: raw.assignedTo,
      }));
    } catch (error) {
      this.error.set(toErrorMessage(error));
    }
  }

  protected startCreate(): void {
    this.editing.set('new');
    this.form.reset({ name: '', phone: '', email: '', source: 'facebook', interested_project_id: '', budget: 0, status: 'new', assigned_to: '', notes: '', next_follow_up_date: '' });
  }

  protected startEdit(lead: Lead): void {
    this.editing.set(lead);
    this.form.setValue({
      name: lead.name,
      phone: lead.phone,
      email: lead.email ?? '',
      source: lead.source,
      interested_project_id: lead.interested_project_id ?? '',
      budget: lead.budget ?? 0,
      status: lead.status,
      assigned_to: lead.assigned_to ?? '',
      notes: lead.notes ?? '',
      next_follow_up_date: lead.next_follow_up_date ?? '',
    });
  }

  protected async save(): Promise<void> {
    const raw = this.form.getRawValue();
    const payload: LeadPayload = {
      ...raw,
      email: raw.email || null,
      interested_project_id: raw.interested_project_id || null,
      budget: raw.budget || null,
      assigned_to: raw.assigned_to || null,
      notes: raw.notes || null,
      next_follow_up_date: raw.next_follow_up_date || null,
    };
    try {
      const editing = this.editing();
      if (editing === 'new') {
        await this.leadsService.create(payload);
      } else if (editing) {
        await this.leadsService.update(editing.id, payload);
      }
      this.cancel();
      await this.load();
    } catch (error) {
      this.error.set(toErrorMessage(error));
    }
  }

  protected cancel(): void {
    this.editing.set(null);
  }

  protected statusKey(status: LeadStatus): string {
    return labelKey('leadStatuses', status);
  }

  protected sourceKey(source: LeadSource): string {
    return labelKey('leadSources', source);
  }

  private async loadSupport(): Promise<void> {
    const [projects, users] = await Promise.all([this.projectsService.list(), this.usersService.list()]);
    this.projects.set(projects);
    this.users.set(users);
  }
}
