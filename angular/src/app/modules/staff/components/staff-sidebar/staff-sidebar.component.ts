import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-staff-sidebar',
  templateUrl: './staff-sidebar.component.html',
  styleUrls: ['./staff-sidebar.component.scss']
})
export class StaffSidebarComponent {
  menuItems = [
    { path: '/staff/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/staff/documents', label: 'Process Documents', icon: 'documents' },
    { path: '/staff/appointments', label: 'Appointment Management', icon: 'appointment' },
    { path: '/staff/certificates', label: 'Certificate Management', icon: 'certificate' },
    { path: '/staff/basketball-courts', label: 'Basketball Courts', icon: 'basketball' },
    { path: '/staff/profile', label: 'Profile', icon: 'profile' }
  ];

  constructor(private router: Router) {}

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  isActive(path: string): boolean {
    return this.router.url === path;
  }
}
