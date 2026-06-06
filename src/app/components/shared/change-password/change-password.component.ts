import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss']
})
export class ChangePasswordComponent {
  @Input() passwordChangedAt: string | null = null;

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  isChanging = false;
  message = '';
  isError = false;

  constructor(private authService: AuthService) {}

  changePassword(): void {
    this.message = '';
    this.isError = false;

    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.message = 'Please fill in all password fields.';
      this.isError = true;
      return;
    }

    if (this.newPassword.length < 6) {
      this.message = 'New password must be at least 6 characters.';
      this.isError = true;
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.message = 'New password and confirmation do not match.';
      this.isError = true;
      return;
    }

    if (this.currentPassword === this.newPassword) {
      this.message = 'New password must be different from your current password.';
      this.isError = true;
      return;
    }

    this.isChanging = true;
    this.authService.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: (result) => {
        this.message = result.message;
        this.isError = false;
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.isChanging = false;
        const user = this.authService.getCurrentUser();
        if (user?.passwordChangedAt) {
          this.passwordChangedAt = user.passwordChangedAt;
        }
      },
      error: (err) => {
        this.message = err?.error?.message || err?.message || 'Failed to change password.';
        this.isError = true;
        this.isChanging = false;
      }
    });
  }

  formatDate(date: string | null): string {
    if (!date) return 'Never changed';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
}
