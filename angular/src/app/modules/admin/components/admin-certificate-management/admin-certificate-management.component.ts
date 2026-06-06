import { Component, OnInit } from '@angular/core';
import { CertificateService, Certificate } from '../../../../services/certificate.service';

@Component({
  selector: 'app-admin-certificate-management',
  templateUrl: './admin-certificate-management.component.html',
  styleUrls: ['./admin-certificate-management.component.scss']
})
export class AdminCertificateManagementComponent implements OnInit {
  certificates: Certificate[] = [];
  filteredCertificates: Certificate[] = [];
  searchTerm: string = '';
  selectedType: string = '';

  constructor(private certificateService: CertificateService) { }

  ngOnInit(): void {
    this.loadCertificates();
  }

  loadCertificates() {
    this.certificateService.certificates$.subscribe(certificates => {
      // Museum shows all certificates: samples and those issued to residents (approved requests)
      this.certificates = certificates || [];
      this.filteredCertificates = this.certificates;
    });
  }

  filterCertificates() {
    this.filteredCertificates = this.certificates.filter(certificate => {
      const term = this.searchTerm.toLowerCase();
      
      // ✅ FIX: Added safe navigation (?) and null coalescing (??)
      // This prevents "Object is possibly undefined" errors
      const matchesSearch = !this.searchTerm || 
        (certificate.userName?.toLowerCase().includes(term) ?? false) ||
        (certificate.certificateNumber?.toLowerCase().includes(term) ?? false) ||
        (certificate.certificateType?.toLowerCase().includes(term) ?? false);
      
      const matchesType = !this.selectedType || certificate.certificateType === this.selectedType;
      
      return matchesSearch && matchesType;
    });
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedType = '';
    this.filteredCertificates = this.certificates;
  }

  getCertificateTypes(): number {
    const types = new Set(this.certificates.map(cert => cert.certificateType));
    return types.size;
  }
  
  // Helper for template dropdowns if needed
  getUniqueTypes(): string[] {
    return Array.from(new Set(this.certificates.map(cert => cert.certificateType)));
  }

  showCertificate(certificate: Certificate): void {
    const baseUrl = '/shared';
    const type = certificate.certificateType || '';
    if (type === 'Barangay Business Clearance') {
      window.open(`${baseUrl}/business-clearance/${certificate.id}`, '_blank');
    } else if (type === 'Certificate of Indigency') {
      window.open(`${baseUrl}/indigency/${certificate.id}`, '_blank');
    } else {
      // Barangay Clearance and any other type use generic certificate view
      window.open(`${baseUrl}/certificate/${certificate.id}`, '_blank');
    }
  }

  // ✅ FIX: Updated signature to accept string | Date | undefined
  // This fixes: "Argument of type 'string' is not assignable to parameter of type 'Date'"
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
      case 'valid':
        return 'bg-blue-100 text-blue-800';
      case 'issued':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'expired':
      case 'revoked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}