import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, User } from '../../../../services/auth.service';
import { SidebarService } from '../../../../services/sidebar.service';

@Component({
  selector: 'app-admin-navbar',
  templateUrl: './admin-navbar.component.html',
  styleUrls: ['./admin-navbar.component.scss']
})
export class AdminNavbarComponent implements OnInit {
  currentUser: User | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    public sidebar: SidebarService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  logout() {
    this.sidebar.close();
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  navigateToProfile() {
    this.sidebar.close();
    this.router.navigate(['/admin/profile']);
  }

  navigateToDashboard() {
    this.sidebar.close();
    this.router.navigate(['/admin/dashboard']);
  }
}
