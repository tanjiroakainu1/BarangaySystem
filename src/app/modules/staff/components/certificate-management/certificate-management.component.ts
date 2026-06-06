import { Component, OnInit } from '@angular/core';
import { CertificateService, Certificate } from '../../../../services/certificate.service';

@Component({
  selector: 'app-certificate-management',
  templateUrl: './certificate-management.component.html',
  styleUrls: ['./certificate-management.component.scss']
})
export class CertificateManagementComponent implements OnInit {
  certificates: Certificate[] = [];

  constructor(private certificateService: CertificateService) { }

  ngOnInit(): void {
    this.loadCertificates();
  }

  loadCertificates() {
    this.certificateService.certificates$.subscribe(certificates => {
      this.certificates = certificates;
    });
  }

  showCertificate(certificate: Certificate): void {
    if (certificate.certificateType === 'Barangay Business Clearance') {
      window.open(`/shared/business-clearance/${certificate.id}`, '_blank');
    } else if (certificate.certificateType === 'Certificate of Indigency') {
      window.open(`/shared/indigency/${certificate.id}`, '_blank');
    } else if (certificate.certificateType === 'Barangay Clearance') {
      window.open(`/shared/certificate/${certificate.id}`, '_blank');
    } else {
      // Use generic certificate component for any other certificate type
      window.open(`/shared/certificate/${certificate.id}`, '_blank');
    }
  }

  // ✅ FIX: Updated to accept string | undefined to match the interface
  formatDate(date: string | Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'ready':
        return 'bg-primary-100 text-primary-800';
      case 'issued':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}