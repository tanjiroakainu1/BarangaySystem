import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage = '';
  basketballCourtMessage = '';
  otpSent = false;
  isLoading = false;
  displayedOtp = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      otp: ['']
    });
  }

  sendOtp() {
    const emailControl = this.loginForm.get('email');
    if (!emailControl?.valid) {
      emailControl?.markAsTouched();
      return;
    }
    const email = emailControl.value;
    const result = this.authService.generateOtp(email);
    if (result.success) {
      this.otpSent = true;
      this.displayedOtp = result.otp || '';
      this.errorMessage = '';
      this.loginForm.get('otp')?.setValidators([Validators.required, Validators.minLength(4), Validators.maxLength(4)]);
      this.loginForm.get('otp')?.updateValueAndValidity();
    } else {
      this.errorMessage = result.message;
    }
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';
    const { email, password, otp } = this.loginForm.value;

    const handleResponse = {
      next: (res: any) => {
        this.isLoading = false;
        this.handleLoginSuccess(res);
      },
      error: (err: any) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Login failed';
      }
    };

    this.authService.login({ email, password, otp: this.otpSent ? otp : undefined }).subscribe(handleResponse);
  }

  handleLoginSuccess(response: any) {
    const user = response.user || response;
    
    if (user.role === 'admin') this.router.navigate(['/admin/dashboard']);
    else if (user.role === 'staff') this.router.navigate(['/staff/dashboard']);
    else this.router.navigate(['/user/dashboard']);
  }

  navigateToRegister() {
    this.router.navigate(['/register']);
  }

  navigateToHome() {
    this.router.navigate(['/']);
  }
}