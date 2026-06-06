import { Component, OnInit } from '@angular/core';
import { CertificateService, AppointmentRequest, Certificate } from '../../../../services/certificate.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-document-management',
  templateUrl: './document-management.component.html',
  styleUrls: ['./document-management.component.scss']
})
export class DocumentManagementComponent implements OnInit {
  appointmentRequests: AppointmentRequest[] = [];
  filteredRequests: AppointmentRequest[] = [];
  certificates: Certificate[] = [];
  searchTerm = '';
  selectedStatus = 'all';

  constructor(private certificateService: CertificateService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    forkJoin({
      appointments: this.certificateService.getAppointmentRequests(),
      certificates: this.certificateService.getAllCertificates()
    }).subscribe(({ appointments, certificates }) => {
      this.appointmentRequests = (appointments || []).map(r => ({
        ...r,
        status: (r.status || 'pending').toLowerCase()
      }));
      this.certificates = certificates || [];
      this.filterRequests();
    });
  }

  onSearchChange(): void {
    this.filterRequests();
  }

  onStatusFilterChange(): void {
    this.filterRequests();
  }

  filterByStatus(status: string): void {
    this.selectedStatus = status;
    this.filterRequests();
  }

  filterRequests(): void {
    const term = this.searchTerm.toLowerCase().trim();
    const status = this.selectedStatus === 'all' ? '' : this.selectedStatus;
    this.filteredRequests = this.appointmentRequests.filter(request => {
      const matchesSearch = !term ||
        (request.userName?.toLowerCase().includes(term)) ||
        (request.userEmail?.toLowerCase().includes(term)) ||
        (request.certificateName?.toLowerCase().includes(term)) ||
        (request.certificateType?.toLowerCase().includes(term));
      const reqStatus = (request.status || '').toLowerCase();
      const matchesStatus = !status || reqStatus === status;
      return matchesSearch && matchesStatus;
    });
  }

  getStatusText(status: string): string {
    if (!status) return 'Pending';
    const s = (status || '').toLowerCase();
    if (s === 'pending') return 'Pending';
    if (s === 'approved') return 'Approved';
    if (s === 'completed') return 'Completed';
    if (s === 'rejected') return 'Rejected';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }

  getResidentDisplay(request: AppointmentRequest): { name: string; email: string } {
    const name = request.userName
      ? (request.userName + '').trim()
      : request.firstName && request.lastName
        ? `${request.firstName} ${request.lastName}`.trim()
        : '';
    const email = (request.userEmail || '').trim();
    const displayName = name && !name.includes('@') ? name : (email || '—');
    return { name: displayName, email };
  }

  getCertificateUrlForRequest(request: AppointmentRequest): string {
    const type = (request.certificateName || request.certificateType || '').toLowerCase();
    const id = request.id;
    return type.includes('indigency')
      ? `/shared/indigency/request/${id}`
      : `/shared/certificate/request/${id}`;
  }

  updateAppointmentStatus(id: string | number, status: 'approved' | 'rejected' | 'completed') {
    const numericId = Number(id);
    this.certificateService.updateAppointmentStatus(numericId, status).subscribe({
      next: () => this.loadData(),
      error: () => this.loadData()
    });
  }

  getCertificateForAppointment(appointmentId: string | number): Certificate | undefined {
    return this.certificates.find(c => Number(c.appointmentId) === Number(appointmentId));
  }

  showCertificate(certificate: Certificate): void {
    if (certificate?.id) {
      window.open(`/shared/certificate/${certificate.id}`, '_blank');
    }
  }

  getStatusBadgeClass(status: string): string {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }

  formatDateTime(date: string | Date | undefined, time: string | undefined): string {
    if (!date) return 'N/A';
    const d = this.formatDate(date);
    return time ? `${d} at ${time}` : d;
  }
}
