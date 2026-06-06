import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-sidebar',
  templateUrl: './user-sidebar.component.html',
  styleUrls: ['./user-sidebar.component.scss']
})
export class UserSidebarComponent {
  menuItems = [
    { path: '/user/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/user/appointment-request', label: 'Request Appointment', icon: 'appointment' },
    { path: '/user/basketball-court-reservation', label: 'Basketball Court', icon: 'basketball' },
    { path: '/user/form-history', label: 'Form History', icon: 'history' },
    { path: '/user/profile', label: 'Profile', icon: 'profile' }
  ];

  constructor(private router: Router) {}

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  isActive(path: string): boolean {
    return this.router.url === path;
  }
}
