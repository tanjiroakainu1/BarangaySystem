import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../../../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-staff-navbar',
  templateUrl: './staff-navbar.component.html',
  styleUrls: ['./staff-navbar.component.scss']
})
export class StaffNavbarComponent implements OnInit {
  currentUser: User | null = null;
  isMenuOpen = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        // ✅ FIX: Use a fallback empty string so .split() never crashes
        const safeName = user.name || ''; 

        this.currentUser = {
          ...user,
          // If firstName is missing, try splitting name. If that fails, default to 'Staff'.
          firstName: user.firstName || safeName.split(' ')[0] || 'Staff',
          lastName: user.lastName || safeName.split(' ').slice(1).join(' ') || ''
        };
      } else {
        this.currentUser = null;
      }
    });
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}