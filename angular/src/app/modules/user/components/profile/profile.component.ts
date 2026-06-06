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
  };

  currentUser: User | null = null;
  message = '';
  isSaving = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.userProfile = {
          firstName: user.firstName ?? '',
          middleName: (user as any).middleName ?? '',
          lastName: user.lastName ?? '',
          suffix: (user as any).suffix ?? '',
          email: user.email ?? '',
          phone: user.phone ?? user.phoneNumber ?? '',
          address: user.address ?? '',
          birthDate: (user as any).birthDate ?? '',
          gender: (user as any).gender ?? '',
          civilStatus: (user as any).civilStatus ?? '',
          nationality: (user as any).nationality ?? '',
        };
      }
    });
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
    });
    this.message = 'Profile updated successfully.';
    this.isSaving = false;
  }
}
