import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CertificateService,
  Certificate,
  formatIssuedDate,
  buildCertificateFromRequest,
  isCertificateViewable,
} from '../../../../services/certificate.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-indigency-certificate',
  templateUrl: './indigency-certificate.component.html',
  styleUrls: ['./indigency-certificate.component.scss']
})
export class IndigencyCertificateComponent implements OnInit {
  certificate: Certificate | null = null;
  isLoading = true;
  error = '';
  formatIssuedDate = formatIssuedDate;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private certificateService: CertificateService
  ) {}

  ngOnInit(): void {
    const requestId = this.route.snapshot.paramMap.get('requestId');
    if (requestId) {
      this.loadCertificateFromRequest(requestId);
      return;
    }
    const certificateId = this.route.snapshot.paramMap.get('id');
    if (certificateId) {
      this.loadCertificate(certificateId);
    } else {
      this.error = 'Certificate ID not provided';
      this.isLoading = false;
    }
  }

  loadCertificateFromRequest(requestId: string): void {
    this.certificateService.getAppointmentById(requestId).subscribe({
      next: (request) => {
        if (!request) {
          this.error = 'Request not found';
          this.isLoading = false;
          return;
        }
        if (!isCertificateViewable(request.status)) {
          this.error = 'This certificate is available after admin approval.';
          this.isLoading = false;
          return;
        }
        this.certificateService.getCertificateByAppointmentId(requestId).subscribe({
          next: (cert) => {
            this.certificate = cert || buildCertificateFromRequest(request);
            this.isLoading = false;
          },
          error: () => {
            this.certificate = buildCertificateFromRequest(request);
            this.isLoading = false;
          }
        });
      },
      error: () => {
        this.error = 'Request not found';
        this.isLoading = false;
      }
    });
  }

  loadCertificate(id: string): void {
    this.certificateService.getCertificateById(id).subscribe({
      next: (cert) => {
        this.certificate = cert;
        if (!cert) {
          this.error = 'Certificate not found';
        } else if (!isCertificateViewable(cert.status)) {
          this.error = 'Certificate is not yet available for viewing';
        }
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Certificate not found';
        this.isLoading = false;
      },
    });
  }

  downloadPDF(): void {
    if (!this.certificate) return;

    const element = document.getElementById('certificate-content');
    if (!element) return;

    html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const certNum = this.certificate!.certificateNumber || 'export';
      const namePart = (this.certificate!.userName || 'certificate').replace(/\s+/g, '_');
      const fileName = `Certificate_of_Indigency_${certNum}_${namePart}.pdf`;
      pdf.save(fileName);
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/certificates']);
  }
}
