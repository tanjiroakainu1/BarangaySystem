import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface CertificateForm {
  id: string | number; 
  name: string;
  type: string;
  requirements: string[];
  price: number;
  description?: string;
  fee?: number; 
  isActive?: boolean;
  processingTime?: string;
}

// ✅ FIX: Strict Type Definition to resolve all Compile Errors
export interface AppointmentRequest {
  // 1. REQUIRED FIELDS (No '?' allows components to use them safely)
  id: string | number; 
  userId: string | number; 
  status: string; 
  
  // 2. DATE & TIME FIELDS
  // We use 'any' for dates to prevent "Type 'string' is not assignable to 'Date'" errors in formatDateTime()
  appointmentDate: any; 
  appointmentTime: string;
  requestedDate: any;   
  requestedTime: string; 
  
  // 3. OPTIONAL FIELDS
  reservationDate?: string;
  userEmail?: string; 
  userName?: string;
  requester?: any;
  courtId?: number;
  purpose?: string;
  createdAt?: any; 
  type?: string;
  certificateName?: string;
  certificateId?: string | number;
  notes?: string;
  
  // Aliases (Optional)
  date?: any; 
  time?: string;
  
  // Personal Info (Optional)
  firstName?: string;
  lastName?: string;
  middleName?: string;
  address?: string;
  purok?: string;
  dateOfBirth?: string;
  gender?: string;
  civilStatus?: string;
  phoneNo?: string;
  residentSince?: string;
  certificateType?: any;
}

export interface Certificate {
  id: number | string;
  userId: number | string;
  userName: string;
  certificateType: string;
  certificateNumber?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'issued';
  requestDate: string;
  issuedDate?: string;
  expiryDate?: string;
  purpose?: string;
  notes?: string;
  appointmentId?: number | string;
  /** Resident details for certificate body (admin fills when approving request) */
  address?: string;
  gender?: string;
  civilStatus?: string;
  dateOfBirth?: string;
  residentSince?: string;
}

/** Build a Certificate view model from a completed appointment request (for resident view/export). */
export function buildCertificateFromRequest(request: AppointmentRequest): Certificate {
  const name = [request.firstName, request.middleName, request.lastName].filter(Boolean).join(' ') || request.userName || request.userEmail || '—';
  const issued = request.createdAt || request.requestedDate || new Date().toISOString();
  return {
    id: request.id,
    userId: request.userId,
    userName: name,
    certificateType: request.certificateName || request.certificateType || 'Certificate',
    certificateNumber: `REQ-${request.id}`,
    status: 'issued',
    requestDate: typeof request.requestedDate === 'string' ? request.requestedDate : (request.requestedDate ? new Date(request.requestedDate).toISOString().slice(0, 10) : ''),
    issuedDate: typeof issued === 'string' ? issued.slice(0, 10) : new Date(issued).toISOString().slice(0, 10),
    purpose: request.purpose,
    notes: request.notes,
    appointmentId: request.id,
    address: request.address,
    gender: request.gender,
    civilStatus: request.civilStatus,
    dateOfBirth: request.dateOfBirth,
    residentSince: request.residentSince,
  };
}

/** Format date as "10th day of October, 2025" for certificate issuance line */
export function formatIssuedDate(date: string | Date | undefined): string {
  if (!date) return '__________';
  const d = new Date(date);
  const day = d.getDate();
  const ord = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
  const month = d.toLocaleString('en-US', { month: 'long' });
  const year = d.getFullYear();
  return `${day}${ord} day of ${month}, ${year}`;
}

@Injectable({
  providedIn: 'root'
})
export class CertificateService {
  
  // ✅ API URL
  private apiUrl = 'https://localhost:44319/api/certificate-forms'; 

  private certificatesSubject = new BehaviorSubject<Certificate[]>([]);
  public certificates$ = this.certificatesSubject.asObservable();

  // Default request certificate forms (aligned with certificate museum)
  private localForms: CertificateForm[] = [
    { id: '1', name: 'Certificate of Residency', type: 'Certificate', requirements: ['Valid ID'], price: 0, fee: 0, description: 'Proof of residence in the barangay', processingTime: '1 day', isActive: true },
    { id: '2', name: 'Certificate of Indigency', type: 'Certificate', requirements: ['Valid ID'], price: 0, fee: 0, description: 'For government assistance and social welfare', processingTime: '1 day', isActive: true },
    { id: '3', name: 'Barangay Clearance', type: 'Clearance', requirements: ['Valid ID'], price: 50, fee: 50, description: 'Standard clearance for employment and other purposes', processingTime: '1 day', isActive: true }
  ];

  constructor(private http: HttpClient) {
    this.loadInitialCertificates();
    try {
      const stored = localStorage.getItem(CertificateService.LOCAL_APPOINTMENTS_KEY);
      if (stored) this.localAppointments = JSON.parse(stored);
      this.localAppointments.forEach(r => {
        if (!r.createdAt) (r as any).createdAt = r.requestedDate || new Date().toISOString();
        if (r.status && typeof r.status === 'string') (r as any).status = r.status.toLowerCase();
      });
      this.saveLocalAppointments();
    } catch (_) {}
  }

  // ✅ HELPER
  getAll(): Observable<CertificateForm[]> {
    return this.getAllCertificateForms();
  }

  private loadInitialCertificates() {
    this.getAllCertificates().subscribe({
      next: (data) => this.certificatesSubject.next(data),
      error: (err) => console.error('Failed to load certificates:', err)
    });
  }

  // --- Certificates ---

  getCertificates(): Observable<Certificate[]> {
    return this.getAllCertificates();
  }

  /** Sample certificates for museum when backend is unavailable; also used as templates. */
  private getMockCertificates(): Certificate[] {
    const issued = new Date().toISOString().slice(0, 10);
    return [
      {
        id: 1,
        userId: 0,
        userName: 'Juan Dela Cruz',
        certificateType: 'Barangay Clearance',
        certificateNumber: 'BC-2025-001',
        status: 'issued',
        requestDate: issued,
        issuedDate: issued,
        purpose: 'Employment',
        address: '123 Barangay Street, Old Cabalan, Olongapo City',
        gender: 'Male',
        civilStatus: 'Single',
        dateOfBirth: '1990-05-15',
        notes: 'NO DEROGATORY RECORD on file as of this date',
      },
      {
        id: 2,
        userId: 0,
        userName: 'Maria Santos',
        certificateType: 'Certificate of Indigency',
        certificateNumber: 'COI-2025-002',
        status: 'issued',
        requestDate: issued,
        issuedDate: issued,
        purpose: 'Government Assistance',
        address: '456 Purok 2, Old Cabalan, Olongapo City',
        gender: 'Female',
        civilStatus: 'Married',
        dateOfBirth: '1985-08-20',
      },
      {
        id: 3,
        userId: 0,
        userName: 'Pedro Reyes',
        certificateType: 'Certificate of Residency',
        certificateNumber: 'COR-2025-003',
        status: 'issued',
        requestDate: issued,
        issuedDate: issued,
        purpose: 'School Requirement',
        address: '789 Sitio Malaga, Old Cabalan, Olongapo City',
        gender: 'Male',
        civilStatus: 'Married',
        dateOfBirth: '1982-01-10',
        residentSince: '2010',
      },
    ];
  }

  getAllCertificates(): Observable<Certificate[]> {
    return this.http.get<Certificate[]>(`${this.apiUrl}/certificates`).pipe(
      tap(data => this.certificatesSubject.next(data)),
      catchError(() => {
        const mock = this.getMockCertificates();
        this.certificatesSubject.next(mock);
        return of(mock);
      })
    );
  }

  getUserCertificates(userId: number | string): Observable<Certificate[]> {
    return this.http.get<Certificate[]>(`${this.apiUrl}/certificates/user/${userId}`).pipe(
      catchError(() => of([]))
    );
  }

  getCertificateByAppointmentId(appointmentId: number): Observable<Certificate> {
    return this.http.get<Certificate>(`${this.apiUrl}/certificates/appointment/${appointmentId}`);
  }

  createCertificate(requestData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/certificates`, requestData);
  }

  updateCertificateStatus(id: number | string, status: string, notes?: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/certificates/${id}/status`, { status, notes }).pipe(
      tap(() => this.loadInitialCertificates()) 
    );
  }

  // --- Appointments (standalone: local store when API unavailable) ---

  private static readonly LOCAL_APPOINTMENTS_KEY = 'barangay_local_appointments';
  private localAppointments: AppointmentRequest[] = [];

  private saveLocalAppointments(): void {
    try {
      localStorage.setItem(CertificateService.LOCAL_APPOINTMENTS_KEY, JSON.stringify(this.localAppointments));
    } catch (_) {}
  }

  requestAppointment(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/appointments`, data).pipe(
      catchError(() => {
        const id = this.localAppointments.length + 1;
        const request: AppointmentRequest = {
          id,
          userId: data.userId,
          status: 'pending',
          appointmentDate: data.appointmentDate,
          appointmentTime: data.appointmentTime || '',
          requestedDate: data.appointmentDate ?? data.requestedDate,
          requestedTime: data.appointmentTime ?? data.requestedTime ?? '',
          userEmail: data.userEmail,
          userName: data.requester,
          requester: data.requester,
          certificateId: data.certificateId,
          certificateType: data.certificateType,
          certificateName: data.certificateType,
          purpose: data.purpose,
          notes: data.notes,
          firstName: data.firstName,
          lastName: data.lastName,
          middleName: data.middleName,
          address: data.address,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          civilStatus: data.civilStatus,
          phoneNo: data.phoneNo,
          residentSince: data.residentSince,
          createdAt: new Date().toISOString(),
        };
        this.localAppointments.push(request);
        this.saveLocalAppointments();
        return of({ success: true });
      })
    );
  }

  getAppointmentRequests(): Observable<AppointmentRequest[]> {
    return this.http.get<AppointmentRequest[]>(`${this.apiUrl}/appointments`).pipe(
      catchError(() => of(this.localAppointments))
    );
  }

  getAllAppointments(): Observable<AppointmentRequest[]> {
    return this.getAppointmentRequests();
  }

  getUserAppointmentRequests(userId: number | string): Observable<AppointmentRequest[]> {
    return this.http.get<AppointmentRequest[]>(`${this.apiUrl}/user/${userId}`).pipe(
      catchError(() => of(this.localAppointments.filter(r => String(r.userId) === String(userId))))
    );
  }

  getUserAppointments(userId: string): Observable<AppointmentRequest[]> {
    return this.getUserAppointmentRequests(userId);
  }

  updateAppointmentStatus(id: number, status: string): Observable<any> {
    const normalizedStatus = (status || '').toLowerCase();
    return this.http.put(`${this.apiUrl}/appointments/${id}/status`, { status: normalizedStatus }).pipe(
      catchError(() => {
        const r = this.localAppointments.find(a => Number(a.id) === Number(id));
        if (r) r.status = normalizedStatus;
        this.saveLocalAppointments();
        return of({});
      })
    );
  }

  /** Get a single appointment by id (for standalone: from local store). */
  getAppointmentById(id: string | number): Observable<AppointmentRequest | null> {
    return this.getAppointmentRequests().pipe(
      map(requests => requests.find(r => String(r.id) === String(id)) || null)
    );
  }

  // --- Forms Management ---

  getCertificateForms(): CertificateForm[] {
    return this.localForms;
  }

  getAllCertificateForms(): Observable<CertificateForm[]> {
    return of(this.localForms);
  }

  getCertificateFormById(id: string | number): CertificateForm | undefined {
    return this.localForms.find(f => f.id.toString() === id.toString());
  }

  addCertificateForm(form: CertificateForm): Observable<CertificateForm> {
    const newId = this.localForms.length + 1;
    const newForm = { ...form, id: newId };
    this.localForms.push(newForm);
    return of(newForm);
  }

  updateCertificateForm(id: string | number, form: Partial<CertificateForm>): Observable<CertificateForm> {
    const index = this.localForms.findIndex(f => f.id.toString() === id.toString());
    if (index !== -1) {
      this.localForms[index] = { ...this.localForms[index], ...form };
      return of(this.localForms[index]);
    }
    return of(form as CertificateForm);
  }

  deleteCertificateForm(id: string | number): Observable<any> {
    this.localForms = this.localForms.filter(f => f.id.toString() !== id.toString());
    return of(true);
  }

  getAvailableTimeSlots(date: string | Date): string[] {
    return [
      '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', 
      '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', 
      '04:00 PM', '05:00 PM'
    ];
  }
}