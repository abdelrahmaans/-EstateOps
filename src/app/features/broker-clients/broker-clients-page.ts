import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';
import { BrokerClientPayload, BrokerClientsService } from '../../core/broker-clients.service';
import { toErrorMessage } from '../../core/errors';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { BrokerClient, BrokerClientStatus, Profile } from '../../core/models';
import { UsersService } from '../../core/users.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog.service';
import { labelKey } from '../../shared/status-label';

@Component({
  selector: 'app-broker-clients-page',
  imports: [DatePipe, ReactiveFormsModule, TranslatePipe],
  template: `
    <section class="page-header">
      <div>
        <p class="eyebrow">{{ 'brokerClients.eyebrow' | t }}</p>
        <h2>{{ 'brokerClients.title' | t }}</h2>
      </div>
      <button class="button primary" type="button" (click)="startCreate()">{{ 'brokerClients.add' | t }}</button>
    </section>

    <form class="filters compact-filters" [formGroup]="filters">
      <select formControlName="status" [attr.aria-label]="'brokerClients.status' | t">
        <option value="">{{ 'common.allStatuses' | t }}</option>
        @for (status of statuses; track status) {
          <option [value]="status">{{ statusKey(status) | t }}</option>
        }
      </select>
      <select formControlName="assignedTo" [attr.aria-label]="'brokerClients.assignedTo' | t">
        <option value="">{{ 'common.allUsers' | t }}</option>
        @for (user of salesUsers(); track user.id) {
          <option [value]="user.id">{{ user.full_name }}</option>
        }
      </select>
      <label class="filter-field">
        <span>{{ 'brokerClients.phoneSearch' | t }}</span>
        <input formControlName="phone" [attr.aria-label]="'brokerClients.phoneSearch' | t" />
      </label>
      <label class="filter-field">
        <span>{{ 'common.updatedAt' | t }}</span>
        <input type="date" formControlName="updatedDate" [attr.aria-label]="'common.updatedAt' | t" />
      </label>
      <button class="button ghost" type="button" (click)="clearFilters()">{{ 'common.clear' | t }}</button>
    </form>

    @if (error()) { <p class="state error" role="alert">{{ error() }}</p> }

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{{ 'brokerClients.name' | t }}</th>
            <th>{{ 'brokerClients.phone' | t }}</th>
            <th>{{ 'brokerClients.callResult' | t }}</th>
            <th>{{ 'brokerClients.status' | t }}</th>
            <th>{{ 'brokerClients.assignedTo' | t }}</th>
            <th>{{ 'brokerClients.clientRecommendations' | t }}</th>
            <th>{{ 'common.createdAt' | t }}</th>
            <th>{{ 'common.updatedAt' | t }}</th>
            <th>{{ 'common.actions' | t }}</th>
          </tr>
        </thead>
        <tbody>
          @for (client of clients(); track client.id) {
            <tr>
              <td>{{ client.name }}</td>
              <td>{{ client.phone }}</td>
              <td>{{ client.call_result ?? ('common.none' | t) }}</td>
              <td><span class="badge">{{ statusKey(client.status) | t }}</span></td>
              <td>{{ client.assignee?.full_name ?? ('common.unassigned' | t) }}</td>
              <td>{{ client.client_recommendations ?? ('common.none' | t) }}</td>
              <td>{{ client.created_at | date:'short' }}</td>
              <td>{{ client.updated_at | date:'short' }}</td>
              <td>
                <div class="table-actions">
                  <button class="icon-button table-action" type="button" (click)="startEdit(client)" [attr.aria-label]="'common.edit' | t">✎</button>
                  <button class="icon-button table-action danger-action" type="button" (click)="deleteClient(client)" [attr.aria-label]="'common.delete' | t">×</button>
                </div>
              </td>
            </tr>
          } @empty {
            <tr><td colspan="9" class="empty">{{ 'common.empty' | t }}</td></tr>
          }
        </tbody>
      </table>
    </div>

    @if (editing()) {
      <section class="drawer" role="dialog" aria-modal="true" [attr.aria-label]="'brokerClients.formTitle' | t">
        <form [formGroup]="form" (ngSubmit)="save()" class="form-grid">
          <h3 class="span-2">{{ 'brokerClients.formTitle' | t }}</h3>
          <label><span>{{ 'brokerClients.name' | t }}</span><input formControlName="name" /></label>
          <label><span>{{ 'brokerClients.phone' | t }}</span><input formControlName="phone" /></label>
          <label><span>{{ 'brokerClients.status' | t }}</span><select formControlName="status">@for (status of statuses; track status) { <option [value]="status">{{ statusKey(status) | t }}</option> }</select></label>
          <label><span>{{ 'brokerClients.assignedTo' | t }}</span><select formControlName="assigned_to"><option value="">{{ 'common.unassigned' | t }}</option>@for (user of salesUsers(); track user.id) { <option [value]="user.id">{{ user.full_name }}</option> }</select></label>
          <label class="span-2"><span>{{ 'brokerClients.callResult' | t }}</span><textarea formControlName="call_result"></textarea></label>
          <label class="span-2"><span>{{ 'brokerClients.clientRecommendations' | t }}</span><textarea formControlName="client_recommendations"></textarea></label>
          <div class="form-actions span-2">
            <button class="button" type="button" (click)="cancel()">{{ 'common.cancel' | t }}</button>
            <button class="button primary" type="submit">{{ 'common.save' | t }}</button>
          </div>
        </form>
      </section>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrokerClientsPage {
  private readonly fb = inject(FormBuilder);
  private readonly brokerClientsService = inject(BrokerClientsService);
  private readonly usersService = inject(UsersService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly clients = signal<BrokerClient[]>([]);
  protected readonly users = signal<Profile[]>([]);
  protected readonly editing = signal<BrokerClient | 'new' | null>(null);
  protected readonly error = signal('');
  protected readonly statuses: BrokerClientStatus[] = ['interested', 'not_interested', 'visited', 'inspection_done', 'purchased'];

  protected readonly filters = this.fb.nonNullable.group({
    status: '',
    assignedTo: '',
    phone: '',
    updatedDate: '',
  });

  protected readonly form = this.fb.nonNullable.group({
    name: '',
    phone: '',
    call_result: '',
    status: 'interested' as BrokerClientStatus,
    assigned_to: '',
    client_recommendations: '',
  });

  constructor() {
    this.filters.valueChanges
      .pipe(debounceTime(250), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => void this.load());
    void this.loadSupport();
    void this.load();
  }

  protected salesUsers(): Profile[] {
    return this.users().filter((user) => user.role === 'sales' || user.role === 'manager');
  }

  protected async load(): Promise<void> {
    try {
      const raw = this.filters.getRawValue();
      this.clients.set(await this.brokerClientsService.list({
        status: raw.status as BrokerClientStatus | '',
        assignedTo: raw.assignedTo,
        phone: raw.phone.trim(),
        updatedDate: raw.updatedDate,
      }));
    } catch (error) {
      this.error.set(toErrorMessage(error));
    }
  }

  protected startCreate(): void {
    this.editing.set('new');
    this.form.reset({
      name: '',
      phone: '',
      call_result: '',
      status: 'interested',
      assigned_to: '',
      client_recommendations: '',
    });
  }

  protected startEdit(client: BrokerClient): void {
    this.editing.set(client);
    this.form.setValue({
      name: client.name,
      phone: client.phone,
      call_result: client.call_result ?? '',
      status: client.status,
      assigned_to: client.assigned_to ?? '',
      client_recommendations: client.client_recommendations ?? '',
    });
  }

  protected async save(): Promise<void> {
    const raw = this.form.getRawValue();
    const payload: BrokerClientPayload = {
      name: raw.name,
      phone: raw.phone,
      call_result: raw.call_result || null,
      status: raw.status,
      assigned_to: raw.assigned_to || null,
      client_recommendations: raw.client_recommendations || null,
    };

    try {
      const editing = this.editing();
      if (editing === 'new') {
        await this.brokerClientsService.create(payload);
        this.resetFilters();
      } else if (editing) {
        await this.brokerClientsService.update(editing.id, payload);
      }
      this.cancel();
      await this.load();
    } catch (error) {
      this.error.set(toErrorMessage(error));
    }
  }

  protected async deleteClient(client: BrokerClient): Promise<void> {
    if (!await this.confirmDialog.confirm()) {
      return;
    }

    try {
      await this.brokerClientsService.remove(client.id);
      await this.load();
    } catch (error) {
      this.error.set(toErrorMessage(error));
    }
  }

  protected clearFilters(): void {
    this.resetFilters();
    void this.load();
  }

  protected cancel(): void {
    this.editing.set(null);
  }

  protected statusKey(status: string | null): string {
    return labelKey('brokerClientStatuses', status);
  }

  private async loadSupport(): Promise<void> {
    this.users.set(await this.usersService.list());
  }

  private resetFilters(): void {
    this.filters.reset({ status: '', assignedTo: '', phone: '', updatedDate: '' }, { emitEvent: false });
  }
}
