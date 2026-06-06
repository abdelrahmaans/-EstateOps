import { Injectable, inject } from '@angular/core';
import { Unit } from './models';
import { SupabaseService } from './supabase.service';

export type UnitPayload = Omit<Unit, 'id' | 'created_at' | 'project'>;

@Injectable({ providedIn: 'root' })
export class UnitsService {
  private readonly supabase = inject(SupabaseService).client;

  async list(): Promise<Unit[]> {
    const { data, error } = await this.supabase
      .from('units')
      .select('*, project:projects(name)')
      .order('code');
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
}
