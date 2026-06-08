import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { toErrorMessage } from '../../core/errors';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { BuyerPurpose, BuyerStatus, Lead, LeadSource, NileSide, PaymentPlan, Profile } from '../../core/models';
import { LeadPayload, LeadsService } from '../../core/leads.service';
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

    <form class="filters wide-filters" [formGroup]="filters" (ngSubmit)="load()">
      <select formControlName="source" [attr.aria-label]="'leads.source' | t">
        <option value="">{{ 'common.allSources' | t }}</option>
        @for (source of leadSources; track source) { <option [value]="source">{{ sourceKey(source) | t }}</option> }
      </select>
      <select formControlName="desiredNileSide" [attr.aria-label]="'leads.desiredNileSide' | t">
        <option value="">{{ 'units.allSides' | t }}</option>
        @for (side of nileSides; track side) { <option [value]="side">{{ sideKey(side) | t }}</option> }
      </select>
      <select formControlName="buyerPurpose" [attr.aria-label]="'leads.buyerPurpose' | t">
        <option value="">{{ 'leads.allPurposes' | t }}</option>
        @for (purpose of buyerPurposes; track purpose) { <option [value]="purpose">{{ purposeKey(purpose) | t }}</option> }
      </select>
      <select formControlName="paymentPlan" [attr.aria-label]="'leads.paymentPlan' | t">
        <option value="">{{ 'units.allPaymentPlans' | t }}</option>
        @for (plan of paymentPlans; track plan) { <option [value]="plan">{{ paymentKey(plan) | t }}</option> }
      </select>
      <select formControlName="buyerStatus" [attr.aria-label]="'leads.buyerStatus' | t">
        <option value="">{{ 'common.allStatuses' | t }}</option>
        @for (status of buyerStatuses; track status) { <option [value]="status">{{ buyerStatusKey(status) | t }}</option> }
      </select>
      <select formControlName="assignedTo" [attr.aria-label]="'leads.assignedTo' | t">
        <option value="">{{ 'common.allUsers' | t }}</option>
        @for (user of salesUsers(); track user.id) { <option [value]="user.id">{{ user.full_name }}</option> }
      </select>
      <input type="number" formControlName="minDesiredArea" [placeholder]="'leads.minDesiredArea' | t" [attr.aria-label]="'leads.minDesiredArea' | t" />
      <input type="number" formControlName="maxDesiredArea" [placeholder]="'leads.maxDesiredArea' | t" [attr.aria-label]="'leads.maxDesiredArea' | t" />
      <button class="button" type="submit">{{ 'common.filter' | t }}</button>
      <button class="button ghost" type="button" (click)="clearFilters()">{{ 'common.clear' | t }}</button>
    </form>

    @if (error()) { <p class="state error" role="alert">{{ error() }}</p> }

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{{ 'leads.name' | t }}</th>
            <th>{{ 'leads.phone' | t }}</th>
            <th>{{ 'leads.source' | t }}</th>
            <th>{{ 'leads.desiredNileSide' | t }}</th>
            <th>{{ 'leads.buyerPurpose' | t }}</th>
            <th>{{ 'leads.desiredArea' | t }}</th>
            <th>{{ 'leads.buyerStatus' | t }}</th>
            <th>{{ 'leads.assignedTo' | t }}</th>
            <th>{{ 'common.actions' | t }}</th>
          </tr>
        </thead>
        <tbody>
          @for (lead of leads(); track lead.id) {
            <tr>
              <td><a [routerLink]="['/leads', lead.id]">{{ lead.name }}</a></td>
              <td>{{ lead.phone }}</td>
              <td>{{ sourceKey(lead.source) | t }}</td>
              <td>{{ sideKey(lead.desired_nile_side) | t }}</td>
              <td>{{ purposeKey(lead.buyer_purpose) | t }}</td>
              <td>{{ lead.desired_area ?? ('common.none' | t) }}</td>
              <td><span class="badge">{{ buyerStatusKey(lead.buyer_status) | t }}</span></td>
              <td>{{ lead.assignee?.full_name ?? ('common.unassigned' | t) }}</td>
              <td><button class="link-button" type="button" (click)="startEdit(lead)">{{ 'common.edit' | t }}</button></td>
            </tr>
          } @empty {
            <tr><td colspan="9" class="empty">{{ 'common.empty' | t }}</td></tr>
          }
        </tbody>
      </table>
    </div>

    @if (editing()) {
      <section class="drawer" role="dialog" aria-modal="true" [attr.aria-label]="'leads.formTitle' | t">
        <form [formGroup]="form" (ngSubmit)="save()" class="form-grid">
          <h3 class="span-2">{{ 'leads.formTitle' | t }}</h3>
          <label><span>{{ 'leads.name' | t }}</span><input formControlName="name" /></label>
          <label><span>{{ 'leads.phone' | t }}</span><input formControlName="phone" /></label>
          <label><span>{{ 'leads.source' | t }}</span><select formControlName="source">@for (source of leadSources; track source) { <option [value]="source">{{ sourceKey(source) | t }}</option> }</select></label>
          <label><span>{{ 'leads.desiredNileSide' | t }}</span><select formControlName="desired_nile_side">@for (side of nileSides; track side) { <option [value]="side">{{ sideKey(side) | t }}</option> }</select></label>
          <label><span>{{ 'leads.buyerPurpose' | t }}</span><select formControlName="buyer_purpose">@for (purpose of buyerPurposes; track purpose) { <option [value]="purpose">{{ purposeKey(purpose) | t }}</option> }</select></label>
          <label><span>{{ 'leads.paymentPlan' | t }}</span><select formControlName="payment_plan">@for (plan of paymentPlans; track plan) { <option [value]="plan">{{ paymentKey(plan) | t }}</option> }</select></label>
          <label><span>{{ 'leads.desiredArea' | t }}</span><input type="number" formControlName="desired_area" /></label>
          <label><span>{{ 'leads.budget' | t }}</span><input type="number" formControlName="budget" /></label>
          <label><span>{{ 'leads.callResult' | t }}</span><input formControlName="call_result" /></label>
          <label><span>{{ 'leads.buyerStatus' | t }}</span><select formControlName="buyer_status">@for (status of buyerStatuses; track status) { <option [value]="status">{{ buyerStatusKey(status) | t }}</option> }</select></label>
          <label><span>{{ 'leads.assignedTo' | t }}</span><select formControlName="assigned_to"><option value="">{{ 'common.unassigned' | t }}</option>@for (user of salesUsers(); track user.id) { <option [value]="user.id">{{ user.full_name }}</option> }</select></label>
          <label><span>{{ 'leads.nextFollowUp' | t }}</span><input type="date" formControlName="next_follow_up_date" /></label>
          <label class="span-2"><span>{{ 'leads.clientRecommendations' | t }}</span><textarea formControlName="client_recommendations"></textarea></label>
          <label class="span-2"><span>{{ 'leads.notes' | t }}</span><textarea formControlName="notes"></textarea></label>
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
export class LeadsList {
  private readonly fb = inject(FormBuilder);
  private readonly leadsService = inject(LeadsService);
  private readonly usersService = inject(UsersService);
  protected readonly leads = signal<Lead[]>([]);
  protected readonly users = signal<Profile[]>([]);
  protected readonly editing = signal<Lead | 'new' | null>(null);
  protected readonly error = signal('');
  protected readonly leadSources: LeadSource[] = ['social', 'company', 'relations'];
  protected readonly nileSides: NileSide[] = ['east', 'west'];
  protected readonly buyerPurposes: BuyerPurpose[] = ['investment', 'personal_use'];
  protected readonly paymentPlans: PaymentPlan[] = ['cash', 'installment'];
  protected readonly buyerStatuses: BuyerStatus[] = ['interested', 'not_interested', 'visited', 'inspection_done', 'purchased'];

  protected readonly filters = this.fb.nonNullable.group({
    source: '',
    desiredNileSide: '',
    buyerPurpose: '',
    paymentPlan: '',
    buyerStatus: '',
    assignedTo: '',
    minDesiredArea: 0,
    maxDesiredArea: 0,
  });

  protected readonly form = this.fb.nonNullable.group({
    name: '',
    phone: '',
    source: 'social' as LeadSource,
    desired_nile_side: 'east' as NileSide,
    buyer_purpose: 'personal_use' as BuyerPurpose,
    desired_area: 0,
    payment_plan: 'cash' as PaymentPlan,
    budget: 0,
    call_result: '',
    buyer_status: 'interested' as BuyerStatus,
    assigned_to: '',
    client_recommendations: '',
    notes: '',
    next_follow_up_date: '',
  });

  constructor() {
    void this.loadSupport();
    void this.load();
  }

  protected salesUsers(): Profile[] {
    return this.users().filter((user) => user.role === 'sales' || user.role === 'manager');
  }

  protected async load(): Promise<void> {
    try {
      const raw = this.filters.getRawValue();
      this.leads.set(await this.leadsService.list({
        source: raw.source as LeadSource | '',
        desiredNileSide: raw.desiredNileSide as NileSide | '',
        buyerPurpose: raw.buyerPurpose as BuyerPurpose | '',
        paymentPlan: raw.paymentPlan as PaymentPlan | '',
        buyerStatus: raw.buyerStatus as BuyerStatus | '',
        assignedTo: raw.assignedTo,
        minDesiredArea: raw.minDesiredArea || null,
        maxDesiredArea: raw.maxDesiredArea || null,
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
      source: 'social',
      desired_nile_side: 'east',
      buyer_purpose: 'personal_use',
      desired_area: 0,
      payment_plan: 'cash',
      budget: 0,
      call_result: '',
      buyer_status: 'interested',
      assigned_to: '',
      client_recommendations: '',
      notes: '',
      next_follow_up_date: '',
    });
  }

  protected startEdit(lead: Lead): void {
    this.editing.set(lead);
    this.form.setValue({
      name: lead.name,
      phone: lead.phone,
      source: lead.source,
      desired_nile_side: lead.desired_nile_side ?? 'east',
      buyer_purpose: lead.buyer_purpose ?? 'personal_use',
      desired_area: lead.desired_area ?? 0,
      payment_plan: lead.payment_plan ?? 'cash',
      budget: lead.budget ?? 0,
      call_result: lead.call_result ?? '',
      buyer_status: lead.buyer_status ?? 'interested',
      assigned_to: lead.assigned_to ?? '',
      client_recommendations: lead.client_recommendations ?? '',
      notes: lead.notes ?? '',
      next_follow_up_date: lead.next_follow_up_date ?? '',
    });
  }

  protected async save(): Promise<void> {
    const raw = this.form.getRawValue();
    const payload: LeadPayload = {
      ...raw,
      email: null,
      interested_project_id: null,
      status: 'new',
      budget: raw.budget || null,
      desired_area: raw.desired_area || null,
      assigned_to: raw.assigned_to || null,
      call_result: raw.call_result || null,
      client_recommendations: raw.client_recommendations || null,
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

  protected clearFilters(): void {
    this.filters.reset({
      source: '',
      desiredNileSide: '',
      buyerPurpose: '',
      paymentPlan: '',
      buyerStatus: '',
      assignedTo: '',
      minDesiredArea: 0,
      maxDesiredArea: 0,
    });
    void this.load();
  }

  protected cancel(): void {
    this.editing.set(null);
  }

  protected sourceKey(source: string | null): string { return labelKey('leadSources', source); }
  protected sideKey(side: string | null): string { return labelKey('nileSides', side); }
  protected purposeKey(purpose: string | null): string { return labelKey('buyerPurposes', purpose); }
  protected paymentKey(plan: string | null): string { return labelKey('paymentPlans', plan); }
  protected buyerStatusKey(status: string | null): string { return labelKey('buyerStatuses', status); }

  private async loadSupport(): Promise<void> {
    this.users.set(await this.usersService.list());
  }
}
