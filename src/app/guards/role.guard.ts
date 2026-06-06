import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    const user = this.auth.getCurrentUser();
    if (!user) {
      return this.router.createUrlTree(['/login']);
    }

    const expectedRoles: string[] = route.data['roles'] || [];
    const userRole = this.normalizeRole(user.role);

    if (expectedRoles.length === 0 || expectedRoles.includes(userRole)) {
      return true;
    }

    return this.router.createUrlTree([this.dashboardForRole(userRole)]);
  }

  private normalizeRole(role: string): string {
    const r = (role || '').toLowerCase();
    if (r === 'resident') return 'user';
    return r;
  }

  private dashboardForRole(role: string): string {
    if (role === 'admin') return '/admin/dashboard';
    if (role === 'staff') return '/staff/dashboard';
    return '/user/dashboard';
  }
}
