import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ChartConfiguration } from 'chart.js';
import { AuthService, User } from '../../../../services/auth.service';
import { CertificateService, AppointmentRequest } from '../../../../services/certificate.service';
import { AnalyticsChartService } from '../../../../services/analytics-chart.service';

@Component({
  selector: 'app-staff-dashboard',
  templateUrl: './staff-dashboard.component.html',
  styleUrls: ['./staff-dashboard.component.scss']
})
export class StaffDashboardComponent implements OnInit {
  currentUser: User | null = null;

  staffStats = {
    pendingAppointments: 0,
    totalProcessed: 0,
    processedToday: 0,
    totalCertificates: 0
  };

  recentAppointments: AppointmentRequest[] = [];
  recentActivities: any[] = [];
  chartsLoaded = false;

  appointmentTrendChart!: ChartConfiguration;
  statusChart!: ChartConfiguration;
  weeklyChart!: ChartConfiguration;
  radarChart!: ChartConfiguration;

  constructor(
    private authService: AuthService,
    private certificateService: CertificateService,
    private analyticsChartService: AnalyticsChartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => this.currentUser = user);
    this.loadDashboardData();
  }

  loadDashboardData() {
    forkJoin({
      appointments: this.certificateService.getAppointmentRequests(),
      certificates: this.certificateService.getAllCertificates()
    }).subscribe({
      next: ({ appointments, certificates }) => {
        const apps = appointments || [];
        this.staffStats.pendingAppointments = apps.filter(a => a.status === 'pending').length;
        this.staffStats.totalProcessed = apps.filter(a => ['approved', 'completed', 'rejected'].includes(a.status)).length;

        const today = new Date().toDateString();
        this.staffStats.processedToday = apps.filter(a =>
          ['approved', 'completed'].includes(a.status) &&
          new Date(a.createdAt || '').toDateString() === today
        ).length;

        this.staffStats.totalCertificates = (certificates || []).length;
        this.recentAppointments = apps.slice(0, 10);

        this.recentActivities = apps.slice(0, 5).map(app => ({
          description: `Processed request for ${app.userName || 'User'}`,
          time: app.createdAt || new Date(),
          type: app.status
        }));

        const charts = this.analyticsChartService.buildDashboardCharts(apps, certificates || []);
        this.appointmentTrendChart = charts.appointmentTrend;
        this.statusChart = charts.statusBreakdown;
        this.weeklyChart = charts.weeklyActivity;
        this.radarChart = charts.processingRadar;
        this.chartsLoaded = true;
      },
      error: () => {
        const charts = this.analyticsChartService.buildDashboardCharts([], []);
        this.appointmentTrendChart = charts.appointmentTrend;
        this.statusChart = charts.statusBreakdown;
        this.weeklyChart = charts.weeklyActivity;
        this.radarChart = charts.processingRadar;
        this.chartsLoaded = true;
      }
    });
  }

  navigateToAppointments() {
    this.router.navigate(['/staff/appointments']);
  }

  navigateToDocuments() {
    this.router.navigate(['/staff/certificates']);
  }

  navigateToCertificates() {
    this.router.navigate(['/staff/certificates']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
