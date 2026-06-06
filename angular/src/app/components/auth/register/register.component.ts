import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  registerForm: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      
      // Optional fields
      middleName: [''], 
      suffix: [''],    
      
      birthDate: ['', Validators.required],
      gender: ['', Validators.required],
      civilStatus: ['', Validators.required],
      nationality: ['', Validators.required],
      
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      phone: ['', Validators.required],
      address: ['', Validators.required],
      
      // Terms checkbox
      agreeToTerms: [false, Validators.requiredTrue] 
    }, {
      validators: this.passwordMatchValidator 
    });
  }

  // Helper to check if passwords match
  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  // ✅ UPDATED: onSubmit with Console Debugging
  onSubmit() {
    console.log('Attempting to submit form...'); 

    if (this.registerForm.invalid) {
      console.error('❌ Form is INVALID. Stopping submit.');
      
      // Loop through all fields to find which one is invalid
      Object.keys(this.registerForm.controls).forEach(key => {
        const control = this.registerForm.get(key);
        if (control?.invalid) {
          console.error(`🔴 Invalid Field: ${key}`, control.errors);
        }
      });

      // Mark all as touched to show red borders to the user
      this.registerForm.markAllAsTouched();
      return;
    }

    console.log('✅ Form is VALID. Sending data...', this.registerForm.value);

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Pass the form value to the service
    this.authService.register(this.registerForm.value).subscribe({
      next: () => {
        console.log('✅ Registration API Success');
        this.isLoading = false;
        this.successMessage = 'Registration successful! Redirecting to login...';
        setTimeout(() => this.navigateToLogin(), 2000);
      },
      error: (err) => {
        console.error('❌ Registration failed', err);
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Registration failed. Please try again.';
      }
    });
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  navigateToHome() {
    this.router.navigate(['/']);
  }
}