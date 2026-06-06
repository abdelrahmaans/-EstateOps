import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { UserRole } from './models';

export const authGuard: CanMatchFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.initialize();
  return auth.session() ? true : router.createUrlTree(['/login']);
};

export function roleGuard(allowedRoles: UserRole[]): CanMatchFn {
  return async () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    await auth.initialize();
    const role = auth.profile()?.role;
    return role && allowedRoles.includes(role) ? true : router.createUrlTree(['/']);
  };
}
