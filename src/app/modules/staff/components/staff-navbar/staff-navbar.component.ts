import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../../../../services/auth.service';
import { Router } from '@angular/router';
import { SidebarService } from '../../../../services/sidebar.service';

@Component({
  selector: 'app-staff-navbar',
  templateUrl: './staff-navbar.component.html',
  styleUrls: ['./staff-navbar.component.scss']
})
export class StaffNavbarComponent implements OnInit {
  currentUser: User | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    public sidebar: SidebarService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        const safeName = user.name || '';
        this.currentUser = {
          ...user,
          firstName: user.firstName || safeName.split(' ')[0] || 'Staff',
          lastName: user.lastName || safeName.split(' ').slice(1).join(' ') || ''
        };
      } else {
        this.currentUser = null;
      }
    });
  }

  navigateToDashboard() {
    this.sidebar.close();
    this.router.navigate(['/staff/dashboard']);
  }

  logout() {
    this.sidebar.close();
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
