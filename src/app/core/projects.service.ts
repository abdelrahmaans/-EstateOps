import { Injectable, inject } from '@angular/core';
import { Project } from './models';
import { SupabaseService } from './supabase.service';

export type ProjectPayload = Omit<Project, 'id' | 'created_at'>;

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private readonly supabase = inject(SupabaseService).client;

  async list(): Promise<Project[]> {
    const { data, error } = await this.supabase.from('projects').select('*').order('name');
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
}
