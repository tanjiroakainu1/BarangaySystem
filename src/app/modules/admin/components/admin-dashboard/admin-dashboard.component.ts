import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ChartConfiguration } from 'chart.js';
import { AuthService } from '../../../../services/auth.service';
import { CertificateService } from '../../../../services/certificate.service';
import { AnalyticsChartService } from '../../../../services/analytics-chart.service';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  stats = {
    totalUsers: 0,
    totalResidents: 0,
    totalStaff: 0,
    pendingAppointments: 0,
    completedAppointments: 0,
    totalCertificates: 0,
    activeStaff: 0
  };

  recentActivities: any[] = [];
  chartsLoaded = false;

  appointmentTrendChart!: ChartConfiguration;
  statusChart!: ChartConfiguration;
  certificateChart!: ChartConfiguration;
  weeklyChart!: ChartConfiguration;

  constructor(
    private authService: AuthService,
    private certificateService: CertificateService,
    private analyticsChartService: AnalyticsChartService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData() {
    forkJoin({
      users: this.authService.getAllUsers(),
      appointments: this.certificateService.getAppointmentRequests(),
      certificates: this.certificateService.getAllCertificates()
    }).subscribe({
      next: (data) => {
        const users = data.users || [];
        this.stats.totalUsers = users.length;
        this.stats.totalResidents = users.filter((u: any) => {
          const role = (u.role || '').toLowerCase();
          return role === 'user' || role === 'resident';
        }).length;
        this.stats.totalStaff = users.filter((u: any) => u.role === 'staff').length;
        this.stats.activeStaff = this.stats.totalStaff;

        const appointments = data.appointments || [];
        this.stats.pendingAppointments = appointments.filter((a: any) => a.status === 'pending').length;
        this.stats.completedAppointments = appointments.filter((a: any) => a.status === 'completed').length;

        const certificates = data.certificates || [];
        this.stats.totalCertificates = certificates.length;

        this.processRecentActivities(appointments);

        const charts = this.analyticsChartService.buildDashboardCharts(appointments, certificates);
        this.appointmentTrendChart = charts.appointmentTrend;
        this.statusChart = charts.statusBreakdown;
        this.certificateChart = charts.certificateTypes;
        this.weeklyChart = charts.weeklyActivity;
        this.chartsLoaded = true;
      },
      error: (err) => {
        console.error('Error loading dashboard data', err);
        const charts = this.analyticsChartService.buildDashboardCharts([], []);
        this.appointmentTrendChart = charts.appointmentTrend;
        this.statusChart = charts.statusBreakdown;
        this.certificateChart = charts.certificateTypes;
        this.weeklyChart = charts.weeklyActivity;
        this.chartsLoaded = true;
      }
    });
  }

  processRecentActivities(appointments: any[]) {
    const recentAppointments = appointments
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || a.reservationDate).getTime();
        const dateB = new Date(b.createdAt || b.reservationDate).getTime();
        return dateB - dateA;
      })
      .slice(0, 5);

    this.recentActivities = recentAppointments.map(appointment => ({
      id: appointment.id,
      type: 'appointment',
      description: `New appointment request for ${appointment.certificateName || appointment.type} from ${appointment.userName}`,
      time: this.getTimeAgo(appointment.createdAt || appointment.reservationDate),
      status: appointment.status
    }));
  }

  getTimeAgo(dateInput: string | Date | undefined): string {
    if (!dateInput) return 'Just now';

    const date = new Date(dateInput);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();

    if (isNaN(diffInMs) || diffInMs < 0) return 'Just now';

    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return diffInMinutes > 0 ? `${diffInMinutes} min ago` : 'Just now';
    }
  }

  navigateToAppointments() {
    this.router.navigate(['/admin/appointments']);
  }

  navigateToUsers() {
    this.router.navigate(['/admin/users']);
  }

  navigateToDocuments() {
    this.router.navigate(['/admin/documents']);
  }

  navigateToReports() {
    this.router.navigate(['/admin/reports']);
  }
}
