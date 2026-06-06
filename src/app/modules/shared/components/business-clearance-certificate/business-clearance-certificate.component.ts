import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CertificateService, Certificate, isCertificateViewable } from '../../../../services/certificate.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-business-clearance-certificate',
  templateUrl: './business-clearance-certificate.component.html',
  styleUrls: ['./business-clearance-certificate.component.scss']
})
export class BusinessClearanceCertificateComponent implements OnInit {
  certificate: Certificate | null = null;
  isLoading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private certificateService: CertificateService
  ) {}

  ngOnInit(): void {
    const certificateId = this.route.snapshot.paramMap.get('id');
    if (certificateId) {
      this.loadCertificate(certificateId);
    } else {
      this.error = 'Certificate ID not provided';
      this.isLoading = false;
    }
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

      const fileName = `Business_Clearance_${this.certificate!.certificateNumber}_${this.certificate!.userName.replace(/\s+/g, '_')}.pdf`;
      pdf.save(fileName);
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/certificates']);
  }
}
