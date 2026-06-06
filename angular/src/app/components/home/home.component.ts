import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  constructor(private router: Router) {}

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  navigateToRegister() {
    this.router.navigate(['/register']);
  }

  navigateToBasketballCourt() {
    // For non-users, redirect to login with a message about basketball court access
    this.router.navigate(['/login'], { 
      queryParams: { 
        message: 'Please login to access basketball court reservations' 
      } 
    });
  }
}
