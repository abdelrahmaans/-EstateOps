import { Injectable, inject } from '@angular/core';
import { Profile } from './models';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly supabase = inject(SupabaseService).client;

  async list(): Promise<Profile[]> {
    const { data, error } = await this.supabase.from('profiles').select('*').order('full_name');
    if (error) {
      throw error;
    }

    return (data ?? []) as Profile[];
  }
}
