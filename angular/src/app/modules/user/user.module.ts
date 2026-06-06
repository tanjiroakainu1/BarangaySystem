import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { UserRoutingModule } from './user-routing.module';
import { UserLayoutComponent } from './components/user-layout/user-layout.component';
import { UserDashboardComponent } from './components/user-dashboard/user-dashboard.component';
import { UserNavbarComponent } from './components/user-navbar/user-navbar.component';
import { UserSidebarComponent } from './components/user-sidebar/user-sidebar.component';
import { AppointmentRequestComponent } from './components/appointment-request/appointment-request.component';
import { FormHistoryComponent } from './components/form-history/form-history.component';
import { ProfileComponent } from './components/profile/profile.component';
import { BasketballCourtReservationComponent } from './components/basketball-court-reservation/basketball-court-reservation.component';

@NgModule({
  declarations: [
    UserLayoutComponent,
    UserDashboardComponent,
    UserNavbarComponent,
    UserSidebarComponent,
    AppointmentRequestComponent,
    FormHistoryComponent,
    ProfileComponent,
    BasketballCourtReservationComponent
  ],
  imports: [
    CommonModule,
    UserRoutingModule,
    ReactiveFormsModule,
    FormsModule
  ]
})
export class UserModule { }
