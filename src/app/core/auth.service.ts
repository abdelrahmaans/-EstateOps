import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Session } from '@supabase/supabase-js';
import { Profile } from './models';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly router = inject(Router);
  readonly session = signal<Session | null>(null);
  readonly profile = signal<Profile | null>(null);
  readonly loading = signal(true);

  constructor() {
    void this.initialize();
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.session.set(session);
      void this.loadProfile(session?.user.id ?? null);
    });
  }

  async initialize(): Promise<void> {
    this.loading.set(true);
    const { data } = await this.supabase.auth.getSession();
    this.session.set(data.session);
    await this.loadProfile(data.session?.user.id ?? null);
    this.loading.set(false);
  }

  async login(email: string, password: string): Promise<void> {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw error;
    }

    this.session.set(data.session);
    await this.loadProfile(data.user.id);
  }

  async logout(): Promise<void> {
    await this.supabase.auth.signOut();
    this.session.set(null);
    this.profile.set(null);
    await this.router.navigate(['/login']);
  }

  private async loadProfile(userId: string | null): Promise<void> {
    if (!userId) {
      this.profile.set(null);
      return;
    }

    const { data, error } = await this.supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) {
      this.profile.set(null);
      return;
    }

    this.profile.set(data as Profile);
  }
}
