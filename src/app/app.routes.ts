import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { Login } from './features/auth/login';
import { CalendarPage } from './features/calendar/calendar-page';
import { Dashboard } from './features/dashboard/dashboard';
import { LeadDetail } from './features/leads/lead-detail';
import { LeadsList } from './features/leads/leads-list';
import { ProjectsPage } from './features/projects/projects-page';
import { AppShell } from './features/shell/app-shell';
import { TasksPage } from './features/tasks/tasks-page';
import { UnitsPage } from './features/units/units-page';

export const routes: Routes = [
  { path: 'login', component: Login },
  {
    path: '',
    component: AppShell,
    canMatch: [authGuard],
    children: [
      { path: '', component: Dashboard },
      { path: 'leads', component: LeadsList },
      { path: 'leads/:id', component: LeadDetail },
      { path: 'projects', component: ProjectsPage },
      { path: 'units', component: UnitsPage },
      { path: 'tasks', component: TasksPage },
      { path: 'calendar', component: CalendarPage },
    ],
  },
  { path: '**', redirectTo: '' },
];
