import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toErrorMessage } from '../../core/errors';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { ActivityType, Lead, LeadActivity } from '../../core/models';
import { LeadsService } from '../../core/leads.service';
import { labelKey } from '../../shared/status-label';

@Component({
  selector: 'app-lead-detail',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  template: `
    <section class="page-header">
      <div>
        <a class="back-link" routerLink="/leads">{{ 'common.back' | t }}</a>
        <h2>{{ lead()?.name ?? ('leads.detail' | t) }}</h2>
        <p>{{ lead()?.phone }}</p>
      </div>
      @if (lead()) {
        <span class="badge">{{ buyerStatusKey(lead()?.buyer_status ?? null) | t }}</span>
      }
    </section>

    @if (error()) { <p class="state error" role="alert">{{ error() }}</p> }

    @if (lead(); as currentLead) {
      <section class="detail-grid">
        <article class="panel">
          <h3>{{ 'leads.detail' | t }}</h3>
          <dl class="details-list">
            <div><dt>{{ 'leads.source' | t }}</dt><dd>{{ sourceKey(currentLead.source) | t }}</dd></div>
            <div><dt>{{ 'leads.desiredNileSide' | t }}</dt><dd>{{ sideKey(currentLead.desired_nile_side) | t }}</dd></div>
            <div><dt>{{ 'leads.buyerPurpose' | t }}</dt><dd>{{ purposeKey(currentLead.buyer_purpose) | t }}</dd></div>
            <div><dt>{{ 'leads.paymentPlan' | t }}</dt><dd>{{ paymentKey(currentLead.payment_plan) | t }}</dd></div>
            <div><dt>{{ 'leads.desiredArea' | t }}</dt><dd>{{ currentLead.desired_area ?? ('common.none' | t) }}</dd></div>
            <div><dt>{{ 'leads.assignedTo' | t }}</dt><dd>{{ currentLead.assignee?.full_name ?? ('common.unassigned' | t) }}</dd></div>
            <div><dt>{{ 'leads.budget' | t }}</dt><dd>{{ currentLead.budget ?? ('common.none' | t) }}</dd></div>
            <div><dt>{{ 'leads.nextFollowUp' | t }}</dt><dd>{{ currentLead.next_follow_up_date ?? ('common.none' | t) }}</dd></div>
            <div class="span-2"><dt>{{ 'leads.callResult' | t }}</dt><dd>{{ currentLead.call_result ?? ('common.none' | t) }}</dd></div>
            <div class="span-2"><dt>{{ 'leads.clientRecommendations' | t }}</dt><dd>{{ currentLead.client_recommendations ?? ('common.none' | t) }}</dd></div>
            <div class="span-2"><dt>{{ 'leads.notes' | t }}</dt><dd>{{ currentLead.notes ?? ('common.none' | t) }}</dd></div>
          </dl>
        </article>

        <article class="panel">
          <h3>{{ 'activities.add' | t }}</h3>
          <form [formGroup]="activityForm" (ngSubmit)="addActivity()" class="form-stack">
            <label><span>{{ 'activities.type' | t }}</span><select formControlName="type">@for (type of activityTypes; track type) { <option [value]="type">{{ activityKey(type) | t }}</option> }</select></label>
            <label><span>{{ 'activities.note' | t }}</span><textarea formControlName="note"></textarea></label>
            <button class="button primary" type="submit">{{ 'common.save' | t }}</button>
          </form>
        </article>
      </section>

      <section class="panel">
        <h3>{{ 'activities.timeline' | t }}</h3>
        <ol class="timeline">
          @for (activity of activities(); track activity.id) {
            <li>
              <span class="badge">{{ activityKey(activity.type) | t }}</span>
              <p>{{ activity.note }}</p>
              <small>{{ activity.creator?.full_name ?? ('auth.user' | t) }} · {{ activity.created_at }}</small>
            </li>
          } @empty {
            <li class="empty">{{ 'activities.empty' | t }}</li>
          }
        </ol>
      </section>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeadDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly leadsService = inject(LeadsService);
  private readonly fb = inject(FormBuilder);
  protected readonly lead = signal<Lead | null>(null);
  protected readonly activities = signal<LeadActivity[]>([]);
  protected readonly error = signal('');
  protected readonly activityTypes: ActivityType[] = ['call', 'whatsapp', 'meeting', 'note', 'follow_up'];
  protected readonly activityForm = this.fb.nonNullable.group({ type: 'call' as ActivityType, note: '' });

  constructor() {
    void this.load();
  }

  protected async addActivity(): Promise<void> {
    const lead = this.lead();
    if (!lead) {
      return;
    }
    const { type, note } = this.activityForm.getRawValue();
    try {
      await this.leadsService.addActivity(lead.id, type, note);
      this.activityForm.reset({ type: 'call', note: '' });
      await this.loadActivities(lead.id);
    } catch (error) {
      this.error.set(toErrorMessage(error));
    }
  }

  protected buyerStatusKey(status: string | null): string { return labelKey('buyerStatuses', status); }
  protected sourceKey(source: string | null): string { return labelKey('leadSources', source); }
  protected sideKey(side: string | null): string { return labelKey('nileSides', side); }
  protected purposeKey(purpose: string | null): string { return labelKey('buyerPurposes', purpose); }
  protected paymentKey(plan: string | null): string { return labelKey('paymentPlans', plan); }

  protected activityKey(type: ActivityType): string {
    return labelKey('activityTypes', type);
  }

  private async load(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }

    try {
      this.lead.set(await this.leadsService.get(id));
      await this.loadActivities(id);
    } catch (error) {
      this.error.set(toErrorMessage(error));
    }
  }

  private async loadActivities(id: string): Promise<void> {
    this.activities.set(await this.leadsService.activities(id));
  }
}
