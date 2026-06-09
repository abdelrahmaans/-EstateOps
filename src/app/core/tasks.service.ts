import { Injectable, inject } from '@angular/core';
import { Task } from './models';
import { SupabaseService } from './supabase.service';

export type TaskPayload = Omit<Task, 'id' | 'created_at' | 'updated_at' | 'assignee' | 'creator' | 'lead' | 'created_by'>;

@Injectable({ providedIn: 'root' })
export class TasksService {
  private readonly supabase = inject(SupabaseService).client;

  async list(): Promise<Task[]> {
    const { data, error } = await this.supabase
      .from('tasks')
      .select('*, assignee:profiles!tasks_assigned_to_fkey(full_name), creator:profiles!tasks_created_by_fkey(full_name), lead:leads!tasks_related_lead_id_fkey(name)')
      .order('due_date', { ascending: true });
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
}
