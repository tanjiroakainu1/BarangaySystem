import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../../../../services/auth.service';
import { CertificateService, AppointmentRequest, Certificate } from '../../../../services/certificate.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-form-history',
  templateUrl: './form-history.component.html',
  styleUrls: ['./form-history.component.scss']
})
export class FormHistoryComponent implements OnInit {
  currentUser: User | null = null;
  appointmentRequests: AppointmentRequest[] = [];
  certificates: Certificate[] = [];
  isLoading = false;
  selectedTab: string = 'appointments';

  constructor(
    private authService: AuthService,
    private certificateService: CertificateService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (this.currentUser) {
        this.loadHistory();
      }
    });
  }

  loadHistory() {
    if (!this.currentUser) return;
    
    this.isLoading = true;

    // Load both Appointments and Certificates to link them in the UI
    const userId = this.currentUser.id;

    forkJoin({
      appointments: this.certificateService.getUserAppointmentRequests(userId),
      certificates: this.certificateService.getUserCertificates(userId)
    }).subscribe({
      next: (result) => {
        this.appointmentRequests = result.appointments;
        this.certificates = result.certificates;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading history:', err);
        this.isLoading = false;
      }
    });
  }

  selectTab(tab: string): void {
    this.selectedTab = tab;
  }

  getStatusText(status: string): string {
    if (!status) return 'N/A';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }

  getCertificateDetails(appointmentId: string | number): Certificate | undefined {
    return this.certificates.find(c => c.appointmentId?.toString() === appointmentId.toString());
  }

  getCertificateForAppointment(appointmentId: string | number): Certificate | undefined {
    return this.getCertificateDetails(appointmentId);
  }

  /** Open certificate view for a completed request (uses request id; works in standalone). */
  viewCertificateForRequest(request: AppointmentRequest): void {
    if (!request?.id) return;
    const type = (request.certificateName || request.certificateType || '').toLowerCase();
    const requestId = request.id;
    if (type.includes('indigency')) {
      window.open(`/shared/indigency/request/${requestId}`, '_blank');
    } else {
      window.open(`/shared/certificate/request/${requestId}`, '_blank');
    }
  }

  showCertificate(cert: Certificate | undefined): void {
    if (cert?.id) this.viewCertificate(cert.id);
  }

  // ✅ FIX: Helper for template badge styles
  getStatusBadgeClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'completed':
      case 'issued':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }

  /** Requested column: prefer createdAt (submit time), else requestedDate (appointment date), else — */
  getRequestedDisplay(request: AppointmentRequest): string {
    const a = this.formatDate(request.createdAt);
    const b = this.formatDate(request.requestedDate);
    return a !== 'N/A' ? a : b !== 'N/A' ? b : '—';
  }

  formatDateTime(date: string | Date | undefined, time: string | undefined): string {
    if (!date) return 'N/A';
    const d = this.formatDate(date);
    // If time is provided, append it; otherwise just return date
    return time ? `${d} at ${time}` : d;
  }
  
  // Optional: Open certificate if available
  viewCertificate(certificateId: string | number) {
    if (certificateId) {
      window.open(`/shared/certificate/${certificateId}`, '_blank');
    }
  }
}