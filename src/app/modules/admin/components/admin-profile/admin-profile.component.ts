import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../../../../services/auth.service';

@Component({
  selector: 'app-admin-profile',
  templateUrl: './admin-profile.component.html',
  styleUrls: ['./admin-profile.component.scss']
})
export class AdminProfileComponent implements OnInit {
  adminProfile = {
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    position: '',
    department: '',
    employeeId: '',
    hireDate: '',
    role: '',
  };
  passwordChangedAt: string | null = null;
  isSaving = false;
  message = '';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user) this.populateFromUser(user);
    });
    this.authService.refreshCurrentUser().subscribe();
  }

  private populateFromUser(user: User): void {
    this.adminProfile = {
      firstName: user.firstName || '',
      middleName: user.middleName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || user.phoneNumber || '',
      address: user.address || '',
      position: user.position || '',
      department: user.department || '',
      employeeId: user.employeeId || '',
      hireDate: user.hireDate || '',
      role: user.role || 'admin',
    };
    this.passwordChangedAt = user.passwordChangedAt || null;
  }

  updateProfile(): void {
    this.isSaving = true;
    this.message = '';
    this.authService.updateProfile({
      firstName: this.adminProfile.firstName,
      middleName: this.adminProfile.middleName,
      lastName: this.adminProfile.lastName,
      phone: this.adminProfile.phone,
      address: this.adminProfile.address,
      position: this.adminProfile.position,
      department: this.adminProfile.department,
    }).subscribe({
      next: (user) => {
        if (user?.passwordChangedAt) {
          this.passwordChangedAt = user.passwordChangedAt;
        }
        this.message = 'Profile updated successfully.';
        this.isSaving = false;
      },
      error: () => {
        this.message = 'Failed to update profile.';
        this.isSaving = false;
      }
    });
  }
}
