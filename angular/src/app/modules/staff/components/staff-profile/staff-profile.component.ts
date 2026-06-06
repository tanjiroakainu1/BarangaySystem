import { Component } from '@angular/core';

@Component({
  selector: 'app-staff-profile',
  templateUrl: './staff-profile.component.html',
  styleUrls: ['./staff-profile.component.scss']
})
export class StaffProfileComponent {
  staffProfile = {
    firstName: 'Maria',
    lastName: 'Santos',
    email: 'maria@barangay.gov.ph',
    phone: '09123456789',
    position: 'Document Processor',
    department: 'Administrative Services',
    employeeId: 'EMP001',
    hireDate: '2023-01-15'
  };

  updateProfile() {
    console.log('Update staff profile');
  }
}
