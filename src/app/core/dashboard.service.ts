import { Injectable, inject } from '@angular/core';
import { DashboardStats } from './models';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly supabase = inject(SupabaseService).client;

  async stats(): Promise<DashboardStats> {
    const today = new Date().toISOString().slice(0, 10);
    const [
      totalLeads,
      newLeads,
      followUpsToday,
      overdueFollowUps,
      availableUnits,
      reservedUnits,
      soldUnits,
      totalTasks,
    ] = await Promise.all([
      this.count('leads'),
      this.count('leads', 'status', 'new'),
      this.countByDate('leads', 'next_follow_up_date', today),
      this.countBeforeDate('leads', 'next_follow_up_date', today),
      this.count('units', 'status', 'available'),
      this.count('units', 'status', 'reserved'),
      this.count('units', 'status', 'sold'),
      this.count('tasks'),
    ]);

    return { totalLeads, newLeads, followUpsToday, overdueFollowUps, availableUnits, reservedUnits, soldUnits, totalTasks };
  }

  private async count(table: 'leads' | 'units' | 'tasks', column?: string, value?: string): Promise<number> {
    let query = this.supabase.from(table).select('id', { count: 'exact', head: true });
    if (column && value) {
      query = query.eq(column, value);
    }

    const { count, error } = await query;
    if (error) {
      throw error;
    }

    return count ?? 0;
  }

  private async countByDate(table: 'leads', column: string, date: string): Promise<number> {
    const { count, error } = await this.supabase.from(table).select('id', { count: 'exact', head: true }).eq(column, date);
    if (error) {
      throw error;
    }

    return count ?? 0;
  }

  private async countBeforeDate(table: 'leads', column: string, date: string): Promise<number> {
    const { count, error } = await this.supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
      .lt(column, date)
      .not(column, 'is', null);
    if (error) {
      throw error;
    }

    return count ?? 0;
  }
}
