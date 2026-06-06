import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-sidebar',
  templateUrl: './admin-sidebar.component.html',
  styleUrls: ['./admin-sidebar.component.scss']
})
export class AdminSidebarComponent {
  menuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/admin/documents', label: 'Document Management', icon: 'documents' },
    { path: '/admin/users', label: 'User Management', icon: 'user-management' },
    { path: '/admin/certificate-forms', label: 'Certificate Forms', icon: 'certificate' },
    { path: '/admin/appointments', label: 'Appointment Management', icon: 'appointment' },
    { path: '/admin/certificates', label: 'Certificate Museum', icon: 'certificate-management' },
    { path: '/admin/basketball-courts', label: 'Basketball Courts', icon: 'basketball' },
    { path: '/admin/reports', label: 'Reports', icon: 'reports' },
    { path: '/admin/settings', label: 'Settings', icon: 'settings' }
  ];

  constructor(private router: Router) {}

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  isActive(path: string): boolean {
    return this.router.url === path;
  }
}
