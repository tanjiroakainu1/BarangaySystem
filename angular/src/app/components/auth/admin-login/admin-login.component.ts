import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-login',
  templateUrl: './admin-login.component.html'
})
export class AdminLoginComponent {
  adminLoginForm: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.adminLoginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.adminLoginForm.invalid) return;

    this.isLoading = true;
    const { email, password } = this.adminLoginForm.value;

    // FIX: Passed credentials as an object { email, password }
    this.authService.login({ email, password }).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        
        // Check if user is inside response.user or direct response
        const user = response.user || response;

        if (user.role === 'admin') {
          this.router.navigate(['/admin']);
        } else if (user.role === 'staff') { // ✅ FIXED: Added missing '{' here
          this.router.navigate(['/staff']);
        } else {
          this.errorMessage = 'Unauthorized access. Administrative privileges required.';
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Login failed. Please check your credentials.';
      }
    });
  }

  navigateToRegister() {
    this.router.navigate(['/register']);
  }

  navigateToRegularLogin() {
    this.router.navigate(['/login']);
  }

  navigateToHome() {
    this.router.navigate(['/']);
  }
}