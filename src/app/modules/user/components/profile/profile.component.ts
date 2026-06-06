import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../../../../services/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  userProfile: {
    firstName: string;
    middleName: string;
    lastName: string;
    suffix: string;
    email: string;
    phone: string;
    address: string;
    birthDate: string;
    gender: string;
    civilStatus: string;
    nationality: string;
    purok: string;
    residentSince: string;
  } = {
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    email: '',
    phone: '',
    address: '',
    birthDate: '',
    gender: '',
    civilStatus: '',
    nationality: '',
    purok: '',
    residentSince: '',
  };

  currentUser: User | null = null;
  passwordChangedAt: string | null = null;
  memberSince: string | null = null;
  message = '';
  isSaving = false;
  isLoading = true;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) this.populateFromUser(user);
    });

    this.authService.refreshCurrentUser().subscribe({
      next: () => { this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  private populateFromUser(user: User): void {
    this.passwordChangedAt = user.passwordChangedAt || null;
    this.memberSince = user.createdAt || null;
    this.userProfile = {
      firstName: user.firstName ?? '',
      middleName: user.middleName ?? '',
      lastName: user.lastName ?? '',
      suffix: user.suffix ?? '',
      email: user.email ?? '',
      phone: user.phone ?? user.phoneNumber ?? '',
      address: user.address ?? '',
      birthDate: user.birthDate ?? '',
      gender: user.gender ?? '',
      civilStatus: user.civilStatus ?? '',
      nationality: user.nationality ?? 'Filipino',
      purok: user.purok ?? '',
      residentSince: user.residentSince
        ?? (user.createdAt ? String(new Date(user.createdAt).getFullYear()) : ''),
    };
  }

  updateProfile(): void {
    if (!this.currentUser) return;
    this.isSaving = true;
    this.message = '';
    this.authService.updateProfile({
      firstName: this.userProfile.firstName,
      lastName: this.userProfile.lastName,
      email: this.userProfile.email,
      phone: this.userProfile.phone,
      address: this.userProfile.address,
      middleName: this.userProfile.middleName,
      suffix: this.userProfile.suffix,
      birthDate: this.userProfile.birthDate,
      gender: this.userProfile.gender,
      civilStatus: this.userProfile.civilStatus,
      nationality: this.userProfile.nationality,
      purok: this.userProfile.purok,
      residentSince: this.userProfile.residentSince,
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
