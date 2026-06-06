import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { toErrorMessage } from '../../core/errors';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { Project, Unit, UnitStatus, UnitType } from '../../core/models';
import { ProjectsService } from '../../core/projects.service';
import { UnitPayload, UnitsService } from '../../core/units.service';
import { labelKey } from '../../shared/status-label';

@Component({
  selector: 'app-units-page',
  imports: [ReactiveFormsModule, TranslatePipe],
  template: `
    <section class="page-header"><div><p class="eyebrow">{{ 'units.eyebrow' | t }}</p><h2>{{ 'units.title' | t }}</h2></div><button class="button primary" type="button" (click)="startCreate()">{{ 'units.add' | t }}</button></section>
    @if (error()) { <p class="state error" role="alert">{{ error() }}</p> }
    <div class="table-wrap"><table><thead><tr><th>{{ 'units.code' | t }}</th><th>{{ 'units.project' | t }}</th><th>{{ 'units.type' | t }}</th><th>{{ 'units.area' | t }}</th><th>{{ 'units.price' | t }}</th><th>{{ 'units.status' | t }}</th><th>{{ 'common.actions' | t }}</th></tr></thead><tbody>
      @for (unit of units(); track unit.id) {
        <tr><td>{{ unit.code }}</td><td>{{ unit.project?.name ?? ('common.none' | t) }}</td><td>{{ typeKey(unit.type) | t }}</td><td>{{ unit.area }}</td><td>{{ unit.price }}</td><td><span class="badge" [class]="unit.status">{{ statusKey(unit.status) | t }}</span></td><td><button class="link-button" type="button" (click)="startEdit(unit)">{{ 'common.edit' | t }}</button></td></tr>
      } @empty { <tr><td colspan="7" class="empty">{{ 'common.empty' | t }}</td></tr> }
    </tbody></table></div>
    @if (editing()) {
      <section class="drawer" role="dialog" aria-modal="true"><form class="form-grid" [formGroup]="form" (ngSubmit)="save()">
        <h3>{{ 'units.formTitle' | t }}</h3>
        <label><span>{{ 'units.project' | t }}</span><select formControlName="project_id">@for (project of projects(); track project.id) { <option [value]="project.id">{{ project.name }}</option> }</select></label>
        <label><span>{{ 'units.code' | t }}</span><input formControlName="code" /></label>
        <label><span>{{ 'units.type' | t }}</span><select formControlName="type">@for (type of types; track type) { <option [value]="type">{{ typeKey(type) | t }}</option> }</select></label>
        <label><span>{{ 'units.area' | t }}</span><input type="number" formControlName="area" /></label>
        <label><span>{{ 'units.floor' | t }}</span><input type="number" formControlName="floor" /></label>
        <label><span>{{ 'units.price' | t }}</span><input type="number" formControlName="price" /></label>
        <label><span>{{ 'units.status' | t }}</span><select formControlName="status">@for (status of statuses; track status) { <option [value]="status">{{ statusKey(status) | t }}</option> }</select></label>
        <div class="form-actions span-2"><button class="button" type="button" (click)="cancel()">{{ 'common.cancel' | t }}</button><button class="button primary" type="submit">{{ 'common.save' | t }}</button></div>
      </form></section>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnitsPage {
  private readonly service = inject(UnitsService);
  private readonly projectsService = inject(ProjectsService);
  private readonly fb = inject(FormBuilder);
  protected readonly units = signal<Unit[]>([]);
  protected readonly projects = signal<Project[]>([]);
  protected readonly editing = signal<Unit | 'new' | null>(null);
  protected readonly error = signal('');
  protected readonly statuses: UnitStatus[] = ['available', 'reserved', 'sold'];
  protected readonly types: UnitType[] = ['studio', 'apartment', 'duplex', 'villa', 'office', 'retail'];
  protected readonly form = this.fb.nonNullable.group({ project_id: '', code: '', type: 'apartment' as UnitType, area: 0, floor: 0, price: 0, status: 'available' as UnitStatus });
  constructor() { void this.loadSupport(); void this.load(); }
  protected async load(): Promise<void> { try { this.units.set(await this.service.list()); } catch (error) { this.error.set(toErrorMessage(error)); } }
  protected startCreate(): void { this.editing.set('new'); this.form.reset({ project_id: this.projects()[0]?.id ?? '', code: '', type: 'apartment', area: 0, floor: 0, price: 0, status: 'available' }); }
  protected startEdit(unit: Unit): void { this.editing.set(unit); this.form.setValue({ project_id: unit.project_id, code: unit.code, type: unit.type, area: unit.area, floor: unit.floor ?? 0, price: unit.price, status: unit.status }); }
  protected async save(): Promise<void> { const raw = this.form.getRawValue(); const payload: UnitPayload = { ...raw, floor: raw.floor || null }; try { const editing = this.editing(); if (editing === 'new') { await this.service.create(payload); } else if (editing) { await this.service.update(editing.id, payload); } this.cancel(); await this.load(); } catch (error) { this.error.set(toErrorMessage(error)); } }
  protected cancel(): void { this.editing.set(null); }
  protected statusKey(status: string): string { return labelKey('unitStatuses', status); }
  protected typeKey(type: string): string { return labelKey('unitTypes', type); }
  private async loadSupport(): Promise<void> { this.projects.set(await this.projectsService.list()); }
}
