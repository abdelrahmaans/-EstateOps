import { ActivityType, LeadSource, LeadStatus, ProjectStatus, TaskPriority, TaskStatus, UnitStatus, UnitType } from '../core/models';

export type StatusLike = LeadStatus | LeadSource | ActivityType | ProjectStatus | UnitStatus | UnitType | TaskStatus | TaskPriority;

export function labelKey(prefix: string, value: StatusLike | string | null | undefined): string {
  return value ? `${prefix}.${value}` : 'common.none';
}
