import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { StaffRoutingModule } from './staff-routing.module';
import { StaffLayoutComponent } from './components/staff-layout/staff-layout.component';
import { StaffDashboardComponent } from './components/staff-dashboard/staff-dashboard.component';
import { StaffNavbarComponent } from './components/staff-navbar/staff-navbar.component';
import { StaffSidebarComponent } from './components/staff-sidebar/staff-sidebar.component';
import { ProcessDocumentsComponent } from './components/process-documents/process-documents.component';
import { StaffAppointmentManagementComponent } from './components/staff-appointment-management/staff-appointment-management.component';
import { CertificateManagementComponent } from './components/certificate-management/certificate-management.component';
import { StaffProfileComponent } from './components/staff-profile/staff-profile.component';
import { StaffBasketballCourtManagementComponent } from './components/staff-basketball-court-management/staff-basketball-court-management.component';

@NgModule({
  declarations: [
    StaffLayoutComponent,
    StaffDashboardComponent,
    StaffNavbarComponent,
    StaffSidebarComponent,
    ProcessDocumentsComponent,
    StaffAppointmentManagementComponent,
    CertificateManagementComponent,
    StaffProfileComponent,
    StaffBasketballCourtManagementComponent
  ],
  imports: [
    CommonModule,
    StaffRoutingModule,
    ReactiveFormsModule,
    FormsModule
  ]
})
export class StaffModule { }
