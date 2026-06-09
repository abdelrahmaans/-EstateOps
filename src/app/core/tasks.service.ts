import { Injectable, inject } from '@angular/core';
import { Task } from './models';
import { SupabaseService } from './supabase.service';

export type TaskPayload = Omit<Task, 'id' | 'created_at' | 'updated_at' | 'assignee' | 'creator' | 'lead' | 'created_by'>;

export interface TaskFilters {
  updatedDate?: string;
}

@Injectable({ providedIn: 'root' })
export class TasksService {
  private readonly supabase = inject(SupabaseService).client;

  async list(filters: TaskFilters = {}): Promise<Task[]> {
    let query = this.supabase
      .from('tasks')
      .select('*, assignee:profiles!tasks_assigned_to_fkey(full_name), creator:profiles!tasks_created_by_fkey(full_name), lead:leads!tasks_related_lead_id_fkey(name)')
      .order('due_date', { ascending: true });

    if (filters.updatedDate) {
      query = query.gte('updated_at', `${filters.updatedDate}T00:00:00`).lt('updated_at', `${this.nextDate(filters.updatedDate)}T00:00:00`);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    return (data ?? []) as Task[];
  }

  async create(payload: TaskPayload): Promise<void> {
    const { data: userData, error: userError } = await this.supabase.auth.getUser();
    if (userError || !userData.user) {
      throw userError ?? new Error('No authenticated user');
    }

    const { error } = await this.supabase.from('tasks').insert({
      ...payload,
      created_by: userData.user.id,
    });
    if (error) {
      throw error;
    }
  }

  async update(id: string, payload: Partial<TaskPayload>): Promise<void> {
    const { error } = await this.supabase.from('tasks').update(payload).eq('id', id);
    if (error) {
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabase.from('tasks').delete().eq('id', id);
    if (error) {
      throw error;
    }
  }

  private nextDate(date: string): string {
    const [year, month, day] = date.split('-').map(Number) as [number, number, number];
    return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
  }
}
