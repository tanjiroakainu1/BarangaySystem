import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService, User } from '../../../services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  currentUser: User | null = null;
  shouldShowNavbar = true;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    // Listen to route changes to hide navbar in dashboard modules
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.shouldShowNavbar = !this.isDashboardRoute((event as NavigationEnd).url);
      });
  }

  private isDashboardRoute(url: string): boolean {
    return url.includes('/admin/') || url.includes('/staff/') || url.includes('/user/') || url.includes('/shared/');
  }

  navigateToHome() {
    this.router.navigate(['/home']);
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  navigateToRegister() {
    this.router.navigate(['/register']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  navigateToDashboard() {
    if (!this.currentUser) return;
    const role = this.currentUser.role;
    const path = role === 'Resident' ? 'user' : role;
    this.router.navigate([`/${path}/dashboard`]);
  }

  /** Display name: prefer first+last when they look like real names, else email or part before @ */
  getDisplayName(): string {
    if (!this.currentUser) return 'User';
    const { firstName, lastName, email } = this.currentUser;
    const looksLikeEmail = (s: string | undefined) => !s || s.includes('@');
    if (firstName && lastName && !looksLikeEmail(firstName) && !looksLikeEmail(lastName)) {
      return `${firstName} ${lastName}`.trim();
    }
    if (email) return email.includes('@') ? email.split('@')[0] : email;
    return 'User';
  }
}
