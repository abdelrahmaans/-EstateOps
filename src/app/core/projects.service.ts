import { Injectable, inject } from '@angular/core';
import { Project } from './models';
import { SupabaseService } from './supabase.service';

export type ProjectPayload = Omit<Project, 'id' | 'created_at' | 'updated_at'>;

export interface ProjectFilters {
  updatedDate?: string;
}

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private readonly supabase = inject(SupabaseService).client;

  async list(filters: ProjectFilters = {}): Promise<Project[]> {
    let query = this.supabase.from('projects').select('*').order('name');

    if (filters.updatedDate) {
      query = query.gte('updated_at', `${filters.updatedDate}T00:00:00`).lt('updated_at', `${this.nextDate(filters.updatedDate)}T00:00:00`);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    return (data ?? []) as Project[];
  }

  async create(payload: ProjectPayload): Promise<void> {
    const { error } = await this.supabase.from('projects').insert(payload);
    if (error) {
      throw error;
    }
  }

  async update(id: string, payload: Partial<ProjectPayload>): Promise<void> {
    const { error } = await this.supabase.from('projects').update(payload).eq('id', id);
    if (error) {
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabase.from('projects').delete().eq('id', id);
    if (error) {
      throw error;
    }
  }

  private nextDate(date: string): string {
    const [year, month, day] = date.split('-').map(Number) as [number, number, number];
    return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
  }
}
