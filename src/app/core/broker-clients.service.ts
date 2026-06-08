import { Injectable, inject } from '@angular/core';
import { BrokerClient, BrokerClientStatus } from './models';
import { SupabaseService } from './supabase.service';

export interface BrokerClientFilters {
  status?: BrokerClientStatus | '';
  assignedTo?: string;
  phone?: string;
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
}
