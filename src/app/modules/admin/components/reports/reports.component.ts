import { Component, OnInit } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { forkJoin } from 'rxjs';
import { CertificateService } from '../../../../services/certificate.service';
import { AuthService } from '../../../../services/auth.service';
import { AnalyticsChartService } from '../../../../services/analytics-chart.service';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {
  chartsLoaded = false;
  totalUsers = 0;
  totalAppointments = 0;
  totalCertificates = 0;
  generatedAt = new Date();

  appointmentTrendChart!: ChartConfiguration;
  statusChart!: ChartConfiguration;
  certificateChart!: ChartConfiguration;
  weeklyChart!: ChartConfiguration;
  radarChart!: ChartConfiguration;
  revenueChart!: ChartConfiguration;

  constructor(
    private certificateService: CertificateService,
    private authService: AuthService,
    private analyticsChartService: AnalyticsChartService
  ) {}

  ngOnInit(): void {
    this.loadReportData();
  }

  loadReportData(): void {
    forkJoin({
      appointments: this.certificateService.getAppointmentRequests(),
      certificates: this.certificateService.getAllCertificates(),
      users: this.authService.getAllUsers()
    }).subscribe({
      next: ({ appointments, certificates, users }) => {
        const apps = appointments || [];
        const certs = certificates || [];
        this.totalAppointments = apps.length;
        this.totalCertificates = certs.length;
        this.totalUsers = (users || []).length;
        this.generatedAt = new Date();

        const charts = this.analyticsChartService.buildDashboardCharts(apps, certs);
        this.appointmentTrendChart = charts.appointmentTrend;
        this.statusChart = charts.statusBreakdown;
        this.certificateChart = charts.certificateTypes;
        this.weeklyChart = charts.weeklyActivity;
        this.radarChart = charts.processingRadar;
        this.revenueChart = charts.revenueBar;
        this.chartsLoaded = true;
      },
      error: () => {
        const charts = this.analyticsChartService.buildDashboardCharts([], []);
        this.appointmentTrendChart = charts.appointmentTrend;
        this.statusChart = charts.statusBreakdown;
        this.certificateChart = charts.certificateTypes;
        this.weeklyChart = charts.weeklyActivity;
        this.radarChart = charts.processingRadar;
        this.revenueChart = charts.revenueBar;
        this.chartsLoaded = true;
      }
    });
  }

  generateReport(): void {
    this.loadReportData();
    window.print();
  }

  refreshReports(): void {
    this.chartsLoaded = false;
    this.loadReportData();
  }
}
