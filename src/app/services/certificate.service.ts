import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';
import {
  mapAppointment,
  mapCertificate,
  mapCertificateForm,
  appointmentToDb,
} from './supabase.mapper';

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

export interface AppointmentRequest {
  id: string | number;
  userId: string | number;
  status: string;
  appointmentDate: any;
  appointmentTime: string;
  requestedDate: any;
  requestedTime: string;
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
  date?: any;
  time?: string;
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
  address?: string;
  gender?: string;
  civilStatus?: string;
  dateOfBirth?: string;
  residentSince?: string;
  isSample?: boolean;
}

export function isCertificateViewable(status: string | undefined): boolean {
  const s = (status || '').toLowerCase();
  return s === 'issued' || s === 'approved' || s === 'completed';
}

export function buildCertificateFromRequest(request: AppointmentRequest): Certificate {
  const name = [request.firstName, request.middleName, request.lastName].filter(Boolean).join(' ')
    || request.userName || request.userEmail || '—';
  const issued = request.createdAt || request.requestedDate || new Date().toISOString();
  return {
    id: request.id,
    userId: request.userId,
    userName: name,
    certificateType: request.certificateName || request.certificateType || 'Certificate',
    certificateNumber: `REQ-${request.id}`,
    status: 'issued',
    requestDate: typeof request.requestedDate === 'string' ? request.requestedDate
      : (request.requestedDate ? new Date(request.requestedDate).toISOString().slice(0, 10) : ''),
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

export function formatIssuedDate(date: string | Date | undefined): string {
  if (!date) return '__________';
  const d = new Date(date);
  const day = d.getDate();
  const ord = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
  const month = d.toLocaleString('en-US', { month: 'long' });
  const year = d.getFullYear();
  return `${day}${ord} day of ${month}, ${year}`;
}

@Injectable({ providedIn: 'root' })
export class CertificateService {
  private certificatesSubject = new BehaviorSubject<Certificate[]>([]);
  public certificates$ = this.certificatesSubject.asObservable();

  constructor(
    private supabase: SupabaseService,
    private auth: AuthService,
  ) {
    this.loadInitialCertificates();
  }

  getAll(): Observable<CertificateForm[]> {
    return this.getAllCertificateForms();
  }

  private loadInitialCertificates(): void {
    from(this.auth.whenReady()).pipe(
      switchMap(() => this.getAllCertificates()),
    ).subscribe({
      next: data => this.certificatesSubject.next(data),
      error: err => console.error('Failed to load certificates:', err),
    });
  }

  private isStaffOrAdmin(): boolean {
    return this.auth.isStaffOrAdmin();
  }

  getCertificates(): Observable<Certificate[]> {
    return this.getAllCertificates();
  }

  getAllCertificates(): Observable<Certificate[]> {
    return from(this.auth.whenReady()).pipe(
      switchMap(() => {
        if (this.isStaffOrAdmin()) {
          return from(this.supabase.rpc('list_certificates', {})).pipe(
            catchError((rpcErr) => {
              const missing = rpcErr?.code === '42883' || rpcErr?.code === 'PGRST202';
              if (!missing) return throwError(() => rpcErr);
              return from(
                this.supabase.from('certificates').select('*').order('created_at', { ascending: false })
              );
            })
          );
        }
        const userId = this.auth.getCurrentUser()?.id;
        if (!userId) return of({ data: [], error: null });
        return from(
          this.supabase.from('certificates').select('*').eq('user_id', userId).order('created_at', { ascending: false })
        );
      }),
      map(({ data, error }) => {
        if (error) {
          console.error('certificates load error:', error);
          return [];
        }
        const certs = (data || []).map(mapCertificate);
        this.certificatesSubject.next(certs);
        return certs;
      }),
      catchError((err) => {
        console.error('certificates load failed:', err);
        return of([]);
      }),
    );
  }

  getUserCertificates(userId: number | string): Observable<Certificate[]> {
    return from(
      this.supabase.from('certificates').select('*').eq('user_id', userId)
    ).pipe(
      map(({ data }) => (data || []).map(mapCertificate)),
      catchError(() => of([]))
    );
  }

  getCertificateByAppointmentId(appointmentId: number | string): Observable<Certificate | null> {
    return from(
      this.supabase.from('certificates').select('*').eq('appointment_id', appointmentId).maybeSingle()
    ).pipe(
      map(({ data }) => data ? mapCertificate(data) : null)
    );
  }

  getCertificateById(id: string | number): Observable<Certificate | null> {
    return from(
      this.supabase.from('certificates').select('*').eq('id', id).maybeSingle()
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) return null;
        return mapCertificate(data);
      }),
      catchError(() => of(null))
    );
  }

  createCertificate(requestData: any): Observable<any> {
    return from(
      this.supabase.from('certificates').insert({
        user_id: requestData.userId,
        appointment_id: requestData.appointmentId,
        user_name: requestData.userName,
        certificate_type: requestData.certificateType,
        certificate_number: requestData.certificateNumber,
        status: requestData.status || 'pending',
        request_date: requestData.requestDate,
        issued_date: requestData.issuedDate,
        purpose: requestData.purpose,
        notes: requestData.notes,
        address: requestData.address,
        gender: requestData.gender,
        civil_status: requestData.civilStatus,
        date_of_birth: requestData.dateOfBirth,
        resident_since: requestData.residentSince,
      }).select().single()
    ).pipe(tap(() => this.loadInitialCertificates()));
  }

  updateCertificateStatus(id: number | string, status: string, notes?: string): Observable<any> {
    const updates: any = { status };
    if (notes) updates.notes = notes;
    return from(
      this.supabase.from('certificates').update(updates).eq('id', id).select().single()
    ).pipe(tap(() => this.loadInitialCertificates()));
  }

  requestAppointment(data: any): Observable<any> {
    const payload = appointmentToDb(data);

    return from(
      this.supabase.rpc('create_appointment_request', { p_data: payload })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return { success: true, data: mapAppointment(data) };
      }),
      catchError((rpcErr) => {
        const code = rpcErr?.code || rpcErr?.error?.code;
        const rpcMissing = code === '42883' || code === 'PGRST202' || code === 'PGRST204';
        if (!rpcMissing) {
          return throwError(() => rpcErr);
        }
        return from(
          this.supabase.from('appointment_requests').insert(payload).select().single()
        ).pipe(
          map(({ data, error }) => {
            if (error) throw error;
            return { success: true, data: mapAppointment(data) };
          })
        );
      })
    );
  }

  getAppointmentRequests(): Observable<AppointmentRequest[]> {
    return from(this.auth.whenReady()).pipe(
      switchMap(() => {
        if (this.isStaffOrAdmin()) {
          return from(this.supabase.rpc('list_appointment_requests', {})).pipe(
            catchError((rpcErr) => {
              const missing = rpcErr?.code === '42883' || rpcErr?.code === 'PGRST202';
              if (!missing) return throwError(() => rpcErr);
              return from(
                this.supabase.from('appointment_requests').select('*').order('created_at', { ascending: false })
              );
            })
          );
        }
        const userId = this.auth.getCurrentUser()?.id;
        if (!userId) return of({ data: [], error: null });
        return from(
          this.supabase.from('appointment_requests').select('*').eq('user_id', userId).order('created_at', { ascending: false })
        );
      }),
      map(({ data, error }) => {
        if (error) {
          console.error('appointment_requests load error:', error);
          return [];
        }
        return (data || []).map(mapAppointment);
      }),
      catchError((err) => {
        console.error('appointment_requests load failed:', err);
        return of([]);
      }),
    );
  }

  getAllAppointments(): Observable<AppointmentRequest[]> {
    return this.getAppointmentRequests();
  }

  getUserAppointmentRequests(userId: number | string): Observable<AppointmentRequest[]> {
    return from(this.auth.whenReady()).pipe(
      switchMap(() =>
        from(
          this.supabase.from('appointment_requests').select('*').eq('user_id', userId).order('created_at', { ascending: false })
        )
      ),
      map(({ data, error }) => {
        if (error) {
          console.error('user appointment_requests error:', error);
          return [];
        }
        return (data || []).map(mapAppointment);
      }),
      catchError(() => of([])),
    );
  }

  getUserAppointments(userId: string): Observable<AppointmentRequest[]> {
    return this.getUserAppointmentRequests(userId);
  }

  updateAppointmentStatus(id: number | string, status: string): Observable<AppointmentRequest> {
    const normalizedStatus = (status || '').toLowerCase();

    return from(
      this.supabase.rpc('update_appointment_request_status', {
        p_id: id,
        p_status: normalizedStatus,
      })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        this.loadInitialCertificates();
        return mapAppointment(data);
      }),
      catchError((rpcErr) => {
        const code = rpcErr?.code || rpcErr?.error?.code;
        const msg = String(rpcErr?.message || rpcErr?.error?.message || '').toLowerCase();
        const rpcMissing = code === '42883' || code === 'PGRST202' || code === 'PGRST204';
        const onConflictError = code === '42P10' || msg.includes('on conflict');
        if (!rpcMissing && !onConflictError) {
          return throwError(() => rpcErr);
        }
        return from(
          this.supabase.from('appointment_requests')
            .update({ status: normalizedStatus })
            .eq('id', id)
            .select()
            .single()
        ).pipe(
          switchMap(({ data, error }) => {
            if (error || !data) throw error;
            const appointment = mapAppointment(data);
            if (normalizedStatus === 'approved') {
              return this.issueCertificateFromAppointment(appointment, 'approved').pipe(map(() => appointment));
            }
            if (normalizedStatus === 'completed') {
              return this.issueCertificateFromAppointment(appointment, 'issued').pipe(map(() => appointment));
            }
            return of(appointment);
          })
        );
      })
    );
  }

  private issueCertificateFromAppointment(
    request: AppointmentRequest,
    certStatus: 'approved' | 'issued' = 'issued'
  ): Observable<Certificate | null> {
    return this.getCertificateByAppointmentId(request.id).pipe(
      switchMap(existing => {
        if (existing) {
          if (certStatus === 'issued' && existing.status !== 'issued') {
            return this.updateCertificateStatus(existing.id, 'issued').pipe(map(() => existing));
          }
          return of(existing);
        }
        const built = buildCertificateFromRequest(request);
        return this.createCertificate({
          userId: built.userId,
          appointmentId: request.id,
          userName: built.userName,
          certificateType: built.certificateType,
          certificateNumber: `CERT-${String(request.id).slice(0, 8).toUpperCase()}`,
          status: certStatus,
          requestDate: built.requestDate,
          issuedDate: certStatus === 'issued' ? built.issuedDate : undefined,
          purpose: built.purpose,
          notes: built.notes,
          address: built.address,
          gender: built.gender,
          civilStatus: built.civilStatus,
          dateOfBirth: built.dateOfBirth,
          residentSince: built.residentSince,
        });
      }),
      tap(() => this.loadInitialCertificates())
    );
  }

  /** Certificates residents can view (approved or fully issued) */
  getResidentVisibleCertificates(certificates: Certificate[]): Certificate[] {
    return certificates.filter(c => {
      const s = (c.status || '').toLowerCase();
      return s === 'approved' || s === 'issued' || s === 'completed';
    });
  }

  canViewCertificateForRequest(status: string | undefined): boolean {
    const s = (status || '').toLowerCase();
    return s === 'approved' || s === 'completed' || s === 'issued';
  }

  getAppointmentById(id: string | number): Observable<AppointmentRequest | null> {
    return from(
      this.supabase.from('appointment_requests').select('*').eq('id', id).maybeSingle()
    ).pipe(
      map(({ data }) => data ? mapAppointment(data) : null)
    );
  }

  getAllCertificateForms(): Observable<CertificateForm[]> {
    return from(
      this.supabase.from('certificate_forms').select('*').eq('is_active', true).order('name')
    ).pipe(
      map(({ data, error }) => error ? [] : (data || []).map(mapCertificateForm)),
      catchError(() => of([]))
    );
  }

  getCertificateFormById(id: string | number): Observable<CertificateForm | null> {
    return from(
      this.supabase.from('certificate_forms').select('*').eq('id', id).maybeSingle()
    ).pipe(map(({ data }) => data ? mapCertificateForm(data) : null));
  }

  addCertificateForm(form: CertificateForm): Observable<CertificateForm> {
    return from(
      this.supabase.from('certificate_forms').insert({
        name: form.name,
        type: form.type,
        description: form.description,
        requirements: form.requirements,
        price: form.price,
        fee: form.fee ?? form.price,
        processing_time: form.processingTime,
        is_active: form.isActive ?? true,
      }).select().single()
    ).pipe(map(({ data }) => mapCertificateForm(data)));
  }

  updateCertificateForm(id: string | number, form: Partial<CertificateForm>): Observable<CertificateForm> {
    const updates: any = {};
    if (form.name) updates.name = form.name;
    if (form.type) updates.type = form.type;
    if (form.description !== undefined) updates.description = form.description;
    if (form.requirements) updates.requirements = form.requirements;
    if (form.price !== undefined) updates.price = form.price;
    if (form.fee !== undefined) updates.fee = form.fee;
    if (form.processingTime) updates.processing_time = form.processingTime;
    if (form.isActive !== undefined) updates.is_active = form.isActive;
    return from(
      this.supabase.from('certificate_forms').update(updates).eq('id', id).select().single()
    ).pipe(map(({ data }) => mapCertificateForm(data)));
  }

  deleteCertificateForm(id: string | number): Observable<any> {
    return from(
      this.supabase.from('certificate_forms').delete().eq('id', id)
    );
  }

  getAvailableTimeSlots(date: string | Date): string[] {
    return [
      '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
      '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM',
      '04:00 PM', '05:00 PM',
    ];
  }
}
