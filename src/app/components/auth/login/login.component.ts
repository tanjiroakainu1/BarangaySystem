import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage = '';
  infoMessage = '';
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.handleLoginSuccess({ user: this.authService.getCurrentUser() });
      return;
    }

    this.route.queryParams.subscribe(params => {
      if (params['registered'] === '1') {
        this.infoMessage = 'Account created successfully. Please sign in with your email and password.';
      } else {
        this.infoMessage = params['message'] || '';
      }
      if (params['email']) {
        this.loginForm.patchValue({ email: params['email'] });
      }
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';
    const { email, password } = this.loginForm.value;

    this.authService.login({ email, password }).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.handleLoginSuccess(res);
      },
      error: (err: any) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Login failed. Please check your credentials.';
      }
    });
  }

  handleLoginSuccess(response: any) {
    const user = response.user || response;
    const role = user.role?.toLowerCase();

    if (role === 'admin') {
      this.router.navigate(['/admin/dashboard']);
    } else if (role === 'staff') {
      this.router.navigate(['/staff/dashboard']);
    } else {
      this.router.navigate(['/user/dashboard']);
    }
  }

  navigateToRegister() {
    this.router.navigate(['/register']);
  }

  navigateToHome() {
    this.router.navigate(['/']);
  }
}
