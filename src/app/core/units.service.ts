import { Injectable, inject } from '@angular/core';
import { BuildingCategory, DeliveryStatus, FinishingStatus, NileSide, PaymentPlan, Unit, UnitDistrict, UnitStatus, UnitType } from './models';
import { SupabaseService } from './supabase.service';

export type UnitPayload = Omit<Unit, 'id' | 'created_at' | 'updated_at' | 'project' | 'code'> & { code?: string | null };

export interface UnitFilters {
  projectId?: string;
  status?: UnitStatus | '';
  type?: UnitType | '';
  buildingCategory?: BuildingCategory | '';
  deliveryStatus?: DeliveryStatus | '';
  nileSide?: NileSide | '';
  district?: UnitDistrict | '';
  hasElevator?: 'yes' | 'no' | '';
  finishing?: FinishingStatus | '';
  paymentPlan?: PaymentPlan | '';
  minPrice?: number | null;
  maxPrice?: number | null;
  minArea?: number | null;
  maxArea?: number | null;
  updatedDate?: string;
}

@Injectable({ providedIn: 'root' })
export class UnitsService {
  private readonly supabase = inject(SupabaseService).client;

  async list(filters: UnitFilters = {}): Promise<Unit[]> {
    let query = this.supabase
      .from('units')
      .select('*, project:projects(name)')
      .order('created_at', { ascending: false });

    if (filters.projectId) {
      query = query.eq('project_id', filters.projectId);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    if (filters.buildingCategory) {
      query = query.eq('building_category', filters.buildingCategory);
    }
    if (filters.deliveryStatus) {
      query = query.eq('delivery_status', filters.deliveryStatus);
    }
    if (filters.nileSide) {
      query = query.eq('nile_side', filters.nileSide);
    }
    if (filters.district) {
      query = query.eq('district', filters.district);
    }
    if (filters.hasElevator === 'yes') {
      query = query.eq('has_elevator', true);
    }
    if (filters.hasElevator === 'no') {
      query = query.eq('has_elevator', false);
    }
    if (filters.finishing) {
      query = query.eq('finishing', filters.finishing);
    }
    if (filters.paymentPlan) {
      query = query.eq('payment_plan', filters.paymentPlan);
    }
    if (filters.minPrice !== null && filters.minPrice !== undefined) {
      query = query.gte('price', filters.minPrice);
    }
    if (filters.maxPrice !== null && filters.maxPrice !== undefined) {
      query = query.lte('price', filters.maxPrice);
    }
    if (filters.minArea !== null && filters.minArea !== undefined) {
      query = query.gte('area', filters.minArea);
    }
    if (filters.maxArea !== null && filters.maxArea !== undefined) {
      query = query.lte('area', filters.maxArea);
    }
    if (filters.updatedDate) {
      query = query.gte('updated_at', `${filters.updatedDate}T00:00:00`).lt('updated_at', `${this.nextDate(filters.updatedDate)}T00:00:00`);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    return (data ?? []) as Unit[];
  }

  async create(payload: UnitPayload): Promise<void> {
    const { error } = await this.supabase.from('units').insert(payload);
    if (error) {
      throw error;
    }
  }

  async update(id: string, payload: Partial<UnitPayload>): Promise<void> {
    const { error } = await this.supabase.from('units').update(payload).eq('id', id);
    if (error) {
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabase.from('units').delete().eq('id', id);
    if (error) {
      throw error;
    }
  }

  private nextDate(date: string): string {
    const [year, month, day] = date.split('-').map(Number) as [number, number, number];
    return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
  }
}
