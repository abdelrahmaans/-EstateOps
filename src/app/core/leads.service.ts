import { Injectable, inject } from '@angular/core';
import { ActivityType, BuyerPurpose, Lead, LeadActivity, LeadSource, NileSide, PaymentPlan } from './models';
import { SupabaseService } from './supabase.service';

export interface LeadFilters {
  source?: LeadSource | '';
  desiredNileSide?: NileSide | '';
  buyerPurpose?: BuyerPurpose | '';
  paymentPlan?: PaymentPlan | '';
  minDesiredArea?: number | null;
  maxDesiredArea?: number | null;
}

export type LeadPayload = Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'project' | 'assignee'>;

@Injectable({ providedIn: 'root' })
export class LeadsService {
  private readonly supabase = inject(SupabaseService).client;

  async list(filters: LeadFilters = {}): Promise<Lead[]> {
    let query = this.supabase
      .from('leads')
      .select('*, project:projects(name), assignee:profiles!leads_assigned_to_fkey(full_name)')
      .order('created_at', { ascending: false });

    if (filters.source) {
      query = query.eq('source', filters.source);
    }
    if (filters.desiredNileSide) {
      query = query.eq('desired_nile_side', filters.desiredNileSide);
    }
    if (filters.buyerPurpose) {
      query = query.eq('buyer_purpose', filters.buyerPurpose);
    }
    if (filters.paymentPlan) {
      query = query.eq('payment_plan', filters.paymentPlan);
    }
    if (filters.minDesiredArea !== null && filters.minDesiredArea !== undefined) {
      query = query.gte('desired_area', filters.minDesiredArea);
    }
    if (filters.maxDesiredArea !== null && filters.maxDesiredArea !== undefined) {
      query = query.lte('desired_area', filters.maxDesiredArea);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    return (data ?? []) as Lead[];
  }

  async get(id: string): Promise<Lead | null> {
    const { data, error } = await this.supabase
      .from('leads')
      .select('*, project:projects(name), assignee:profiles!leads_assigned_to_fkey(full_name)')
      .eq('id', id)
      .maybeSingle();
    if (error) {
      throw error;
    }

    return data as Lead | null;
  }

  async create(payload: LeadPayload): Promise<void> {
    const { error } = await this.supabase.from('leads').insert(payload);
    if (error) {
      throw error;
    }
  }

  async update(id: string, payload: Partial<LeadPayload>): Promise<void> {
    const { error } = await this.supabase.from('leads').update(payload).eq('id', id);
    if (error) {
      throw error;
    }
  }

  async activities(leadId: string): Promise<LeadActivity[]> {
    const { data, error } = await this.supabase
      .from('lead_activities')
      .select('*, creator:profiles!lead_activities_created_by_fkey(full_name)')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });
    if (error) {
      throw error;
    }

    return (data ?? []) as LeadActivity[];
  }

  async addActivity(leadId: string, type: ActivityType, note: string): Promise<void> {
    const { data: userData, error: userError } = await this.supabase.auth.getUser();
    if (userError || !userData.user) {
      throw userError ?? new Error('No authenticated user');
    }

    const { error } = await this.supabase.from('lead_activities').insert({
      lead_id: leadId,
      type,
      note,
      created_by: userData.user.id,
    });
    if (error) {
      throw error;
    }
  }
}
