import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, User } from '../../../../services/auth.service';
import { SidebarService } from '../../../../services/sidebar.service';

@Component({
  selector: 'app-user-navbar',
  templateUrl: './user-navbar.component.html',
  styleUrls: ['./user-navbar.component.scss']
})
export class UserNavbarComponent implements OnInit {
  currentUser: User | null = null;

  constructor(
    public authService: AuthService,
    private router: Router,
    public sidebar: SidebarService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  navigateToDashboard() {
    this.sidebar.close();
    this.router.navigate(['/user/dashboard']);
  }

  logout() {
    this.sidebar.close();
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
