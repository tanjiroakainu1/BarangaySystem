import { Component, OnInit } from '@angular/core';
import { CertificateService, AppointmentRequest } from '../../../../services/certificate.service';

@Component({
  selector: 'app-process-documents',
  templateUrl: './process-documents.component.html',
  styleUrls: ['./process-documents.component.scss']
})
export class ProcessDocumentsComponent implements OnInit {
  documents: AppointmentRequest[] = [];
  filteredDocuments: AppointmentRequest[] = [];
  isLoading = true;
  searchTerm = '';
  selectedStatus = 'all';
  showDetailsModal = false;
  selectedDocument: AppointmentRequest | null = null;

  constructor(private certificateService: CertificateService) {}

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.isLoading = true;
    this.certificateService.getAppointmentRequests().subscribe({
      next: (data) => {
        this.documents = (data || []).map(r => ({
          ...r,
          status: (r.status || 'pending').toLowerCase()
        }));
        this.filterDocuments();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  filterDocuments(): void {
    const term = this.searchTerm.toLowerCase().trim();
    const status = this.selectedStatus === 'all' ? '' : this.selectedStatus;
    this.filteredDocuments = this.documents.filter(doc => {
      const matchesSearch = !term ||
        (doc.userName || '').toLowerCase().includes(term) ||
        (doc.certificateName || doc.certificateType || '').toLowerCase().includes(term);
      const matchesStatus = !status || (doc.status || '').toLowerCase() === status;
      return matchesSearch && matchesStatus;
    });
  }

  approveDocument(doc: AppointmentRequest): void {
    this.updateStatus(doc.id, 'approved');
  }

  rejectDocument(doc: AppointmentRequest): void {
    this.updateStatus(doc.id, 'rejected');
  }

  completeDocument(doc: AppointmentRequest): void {
    this.updateStatus(doc.id, 'completed');
  }

  private updateStatus(id: string | number, status: string): void {
    this.certificateService.updateAppointmentStatus(id, status).subscribe({
      next: () => this.loadDocuments(),
      error: () => alert('Failed to update document status.')
    });
  }

  getRequesterName(doc: AppointmentRequest): string {
    if (doc.userName) return doc.userName;
    return [doc.firstName, doc.lastName].filter(Boolean).join(' ') || '—';
  }

  getDocumentType(doc: AppointmentRequest): string {
    return doc.certificateName || doc.certificateType || 'Document';
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }

  getStatusLabel(status: string): string {
    const s = (status || 'pending').toLowerCase();
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  openDetails(doc: AppointmentRequest): void {
    this.selectedDocument = doc;
    this.showDetailsModal = true;
  }

  closeDetails(): void {
    this.showDetailsModal = false;
    this.selectedDocument = null;
  }

  canViewCertificate(status: string | undefined): boolean {
    return this.certificateService.canViewCertificateForRequest(status);
  }

  getCertificateUrl(doc: AppointmentRequest): string {
    const type = (doc.certificateName || doc.certificateType || '').toLowerCase();
    return type.includes('indigency')
      ? `/shared/indigency/request/${doc.id}`
      : `/shared/certificate/request/${doc.id}`;
  }
}
