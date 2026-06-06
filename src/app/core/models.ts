export type UserRole = 'admin' | 'manager' | 'secretary' | 'sales';
export type LeadStatus = 'new' | 'contacted' | 'follow_up' | 'site_visit' | 'negotiation' | 'reserved' | 'contracted' | 'lost';
export type LeadSource = 'facebook' | 'website' | 'referral' | 'walk_in' | 'campaign' | 'other';
export type ActivityType = 'call' | 'whatsapp' | 'meeting' | 'note' | 'follow_up';
export type ProjectStatus = 'planning' | 'active' | 'completed' | 'paused';
export type UnitStatus = 'available' | 'reserved' | 'sold';
export type UnitType = 'studio' | 'apartment' | 'duplex' | 'villa' | 'office' | 'retail';
export type TaskStatus = 'pending' | 'in_progress' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  location: string;
  description: string | null;
  status: ProjectStatus;
  created_at: string;
}

export interface Unit {
  id: string;
  project_id: string;
  project?: Pick<Project, 'name'>;
  code: string;
  type: UnitType;
  area: number;
  floor: number | null;
  price: number;
  status: UnitStatus;
  created_at: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  source: LeadSource;
  interested_project_id: string | null;
  project?: Pick<Project, 'name'> | null;
  budget: number | null;
  status: LeadStatus;
  assigned_to: string | null;
  assignee?: Pick<Profile, 'full_name'> | null;
  notes: string | null;
  next_follow_up_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  type: ActivityType;
  note: string;
  created_by: string;
  creator?: Pick<Profile, 'full_name'> | null;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  assignee?: Pick<Profile, 'full_name'> | null;
  related_lead_id: string | null;
  lead?: Pick<Lead, 'name'> | null;
  due_date: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  totalLeads: number;
  newLeads: number;
  followUpsToday: number;
  overdueFollowUps: number;
  availableUnits: number;
  reservedUnits: number;
  soldUnits: number;
  totalTasks: number;
}
