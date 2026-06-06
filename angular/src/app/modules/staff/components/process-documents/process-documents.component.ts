import { Component } from '@angular/core';

@Component({
  selector: 'app-process-documents',
  templateUrl: './process-documents.component.html',
  styleUrls: ['./process-documents.component.scss']
})
export class ProcessDocumentsComponent {
  documents = [
    { id: 1, type: 'Barangay Clearance', requester: 'Juan Dela Cruz', date: '2024-01-15', status: 'Pending' },
    { id: 2, type: 'Business Permit', requester: 'Maria Santos', date: '2024-01-14', status: 'Pending' },
    { id: 3, type: 'Residency Certificate', requester: 'Pedro Reyes', date: '2024-01-13', status: 'Processing' }
  ];

  approveDocument(doc: any) {
    console.log('Approve document:', doc);
  }

  rejectDocument(doc: any) {
    console.log('Reject document:', doc);
  }
}
