import { Injectable, inject } from '@angular/core';
import { BrokerClient, BrokerClientStatus } from './models';
import { SupabaseService } from './supabase.service';

export interface BrokerClientFilters {
  status?: BrokerClientStatus | '';
  assignedTo?: string;
  phone?: string;
  updatedDate?: string;
}

export type BrokerClientPayload = Omit<BrokerClient, 'id' | 'created_at' | 'updated_at' | 'assignee'>;

@Injectable({ providedIn: 'root' })
export class BrokerClientsService {
  private readonly supabase = inject(SupabaseService).client;

  async list(filters: BrokerClientFilters = {}): Promise<BrokerClient[]> {
    let query = this.supabase
      .from('broker_clients')
      .select('*, assignee:profiles!broker_clients_assigned_to_fkey(full_name)')
      .order('created_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.assignedTo) {
      query = query.eq('assigned_to', filters.assignedTo);
    }
    if (filters.phone) {
      query = query.ilike('phone', `%${filters.phone}%`);
    }
    if (filters.updatedDate) {
      query = query.gte('updated_at', `${filters.updatedDate}T00:00:00`).lt('updated_at', `${this.nextDate(filters.updatedDate)}T00:00:00`);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    return (data ?? []) as BrokerClient[];
  }

  async create(payload: BrokerClientPayload): Promise<void> {
    const { error } = await this.supabase.from('broker_clients').insert(payload);
    if (error) {
      throw error;
    }
  }

  async update(id: string, payload: Partial<BrokerClientPayload>): Promise<void> {
    const { error } = await this.supabase.from('broker_clients').update(payload).eq('id', id);
    if (error) {
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabase.from('broker_clients').delete().eq('id', id);
    if (error) {
      throw error;
    }
  }

  private nextDate(date: string): string {
    const [year, month, day] = date.split('-').map(Number) as [number, number, number];
    return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
  }
}
