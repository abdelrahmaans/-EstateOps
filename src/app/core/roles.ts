import { UserRole } from './models';

export function canAccess(role: UserRole | null, area: 'settings' | 'leads' | 'tasks' | 'salesData'): boolean {
  if (!role) {
    return false;
  }

  if (role === 'admin') {
    return true;
  }

  if (role === 'manager') {
    return area !== 'settings';
  }

  if (role === 'secretary') {
    return area === 'leads' || area === 'tasks' || area === 'salesData';
  }

  return area === 'leads' || area === 'tasks' || area === 'salesData';
}
