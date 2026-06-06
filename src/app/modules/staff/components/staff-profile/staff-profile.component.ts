import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../../../../services/auth.service';

@Component({
  selector: 'app-staff-profile',
  templateUrl: './staff-profile.component.html',
  styleUrls: ['./staff-profile.component.scss']
})
export class StaffProfileComponent implements OnInit {
  staffProfile = {
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    birthDate: '',
    gender: '',
    civilStatus: '',
    nationality: '',
    position: '',
    department: '',
    employeeId: '',
    hireDate: ''
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
    this.passwordChangedAt = user.passwordChangedAt || null;
    this.staffProfile = {
      firstName: user.firstName || '',
      middleName: user.middleName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || user.phoneNumber || '',
      address: user.address || '',
      birthDate: user.birthDate || '',
      gender: user.gender || '',
      civilStatus: user.civilStatus || '',
      nationality: user.nationality || '',
      position: user.position || '',
      department: user.department || '',
      employeeId: user.employeeId || '',
      hireDate: user.hireDate || ''
    };
  }

  updateProfile(): void {
    this.isSaving = true;
    this.message = '';
    this.authService.updateProfile({
      firstName: this.staffProfile.firstName,
      middleName: this.staffProfile.middleName,
      lastName: this.staffProfile.lastName,
      phone: this.staffProfile.phone,
      address: this.staffProfile.address,
      birthDate: this.staffProfile.birthDate,
      gender: this.staffProfile.gender,
      civilStatus: this.staffProfile.civilStatus,
      nationality: this.staffProfile.nationality,
      position: this.staffProfile.position,
      department: this.staffProfile.department,
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
