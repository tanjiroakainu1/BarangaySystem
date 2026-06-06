import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';
import { mapCourt, mapReservation, reservationToDb } from './supabase.mapper';

export interface BasketballCourtReservation {
  id: string;
  userId: number | string;
  userName: string;
  userEmail: string;
  courtNumber: number;
  reservationDate: Date;
  startTime: string;
  endTime: string;
  duration: number;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
}

export interface BasketballCourt {
  id: number;
  supabaseId?: string;
  courtNumber: number;
  name: string;
  location: string;
  capacity: number;
  amenities: string[];
  hourlyRate: number;
  isActive: boolean;
  maintenanceSchedule?: {
    startDate: Date;
    endDate: Date;
    reason: string;
  };
}

@Injectable({ providedIn: 'root' })
export class BasketballCourtService {
  private reservationsSubject = new BehaviorSubject<BasketballCourtReservation[]>([]);
  public reservations$ = this.reservationsSubject.asObservable();

  private courtsSubject = new BehaviorSubject<BasketballCourt[]>([]);
  public courts$ = this.courtsSubject.asObservable();

  private reservations: BasketballCourtReservation[] = [];
  private courts: BasketballCourt[] = [];
  private loaded = false;

  constructor(
    private supabase: SupabaseService,
    private auth: AuthService,
  ) {
    this.loadFromSupabase();
  }

  private async loadReservationsFromDb(): Promise<any[]> {
    await this.auth.whenReady();
    if (this.auth.isStaffOrAdmin()) {
      const { data, error } = await this.supabase.rpc('list_basketball_reservations', {});
      if (!error && data?.length) return data;
      if (error && error.code !== '42883' && error.code !== 'PGRST202') {
        console.error('list_basketball_reservations:', error);
      }
    }
    const userId = this.auth.getCurrentUser()?.id;
    const query = userId
      ? this.supabase.from('basketball_court_reservations').select('*').eq('user_id', userId).order('created_at', { ascending: false })
      : this.supabase.from('basketball_court_reservations').select('*').order('created_at', { ascending: false });
    const { data, error } = await query;
    if (error) {
      console.error('basketball_court_reservations:', error);
      return [];
    }
    return data || [];
  }

  private async loadFromSupabase(): Promise<void> {
    await this.auth.whenReady();
    const [courtsRes, reservationsData] = await Promise.all([
      this.supabase.from('basketball_courts').select('*').order('court_number'),
      this.loadReservationsFromDb(),
    ]);

    if (courtsRes.data?.length) {
      this.courts = courtsRes.data.map((row, i) => {
        const court = mapCourt(row);
        court.id = row.court_number;
        court.supabaseId = row.id;
        return court;
      });
    }

    if (reservationsData?.length) {
      this.reservations = reservationsData.map((row: any) => mapReservation(row));
    }

    this.loaded = true;
    this.reservationsSubject.next(this.reservations);
    this.courtsSubject.next(this.courts);
  }

  private async persistCourt(court: BasketballCourt, isNew = false): Promise<void> {
    const payload: any = {
      court_number: court.courtNumber,
      name: court.name,
      location: court.location,
      capacity: court.capacity,
      amenities: court.amenities,
      hourly_rate: court.hourlyRate,
      is_active: court.isActive,
      maintenance_start: court.maintenanceSchedule?.startDate || null,
      maintenance_end: court.maintenanceSchedule?.endDate || null,
      maintenance_reason: court.maintenanceSchedule?.reason || null,
    };

    if (isNew) {
      const { data } = await this.supabase.from('basketball_courts').insert(payload).select().single();
      if (data) court.supabaseId = data.id;
    } else if (court.supabaseId) {
      await this.supabase.from('basketball_courts').update(payload).eq('id', court.supabaseId);
    } else {
      await this.supabase.from('basketball_courts').update(payload).eq('court_number', court.courtNumber);
    }
  }

  private async persistReservation(reservation: BasketballCourtReservation): Promise<void> {
    const payload: any = {
      user_id: reservation.userId,
      court_number: reservation.courtNumber,
      user_name: reservation.userName,
      user_email: reservation.userEmail,
      reservation_date: reservation.reservationDate.toISOString().slice(0, 10),
      start_time: reservation.startTime,
      end_time: reservation.endTime,
      duration: reservation.duration,
      purpose: reservation.purpose,
      status: reservation.status,
      notes: reservation.notes,
      approved_by: reservation.approvedBy || null,
      approved_at: reservation.approvedAt?.toISOString() || null,
    };

    if (reservation.id) {
      await this.supabase.from('basketball_court_reservations')
        .update(payload).eq('id', reservation.id);
    }
  }

  private findReservationById(reservationId: string): BasketballCourtReservation | undefined {
    return this.reservations.find(r => r.id === reservationId);
  }

  getCourts(): BasketballCourt[] {
    return this.courts.filter(court => court.isActive);
  }

  getAllCourts(): BasketballCourt[] {
    return this.courts;
  }

  getCourtById(courtId: number): BasketballCourt | undefined {
    return this.courts.find(court => court.id === courtId || court.courtNumber === courtId);
  }

  addCourt(courtData: Omit<BasketballCourt, 'id'>): { success: boolean; message?: string } {
    const newCourt: BasketballCourt = {
      id: courtData.courtNumber,
      ...courtData,
    };
    this.courts.push(newCourt);
    this.courtsSubject.next(this.courts);
    this.persistCourt(newCourt, true);
    return { success: true, message: 'Basketball court added successfully' };
  }

  updateCourt(courtId: number, courtData: Partial<BasketballCourt>): { success: boolean; message?: string } {
    const courtIndex = this.courts.findIndex(court => court.id === courtId || court.courtNumber === courtId);
    if (courtIndex !== -1) {
      this.courts[courtIndex] = { ...this.courts[courtIndex], ...courtData };
      this.courtsSubject.next(this.courts);
      this.persistCourt(this.courts[courtIndex]);
      return { success: true, message: 'Basketball court updated successfully' };
    }
    return { success: false, message: 'Basketball court not found' };
  }

  deleteCourt(courtId: number): { success: boolean; message?: string } {
    const court = this.courts.find(c => c.id === courtId || c.courtNumber === courtId);
    const courtIndex = this.courts.findIndex(c => c.id === courtId || c.courtNumber === courtId);
    if (courtIndex !== -1) {
      this.courts.splice(courtIndex, 1);
      this.courtsSubject.next(this.courts);
      if (court?.supabaseId) {
        this.supabase.from('basketball_courts').delete().eq('id', court.supabaseId);
      }
      return { success: true, message: 'Basketball court deleted successfully' };
    }
    return { success: false, message: 'Basketball court not found' };
  }

  getReservations(): BasketballCourtReservation[] {
    return this.reservations;
  }

  getUserReservations(userId: number | string): BasketballCourtReservation[] {
    return this.reservations.filter(r => String(r.userId) === String(userId));
  }

  getCourtReservations(courtNumber: number): BasketballCourtReservation[] {
    return this.reservations.filter(r => r.courtNumber === courtNumber);
  }

  createReservation(
    reservationData: Omit<BasketballCourtReservation, 'id' | 'status' | 'createdAt' | 'updatedAt'>
  ): Observable<{ success: boolean; message?: string }> {
    const courtNumber = Number(reservationData.courtNumber);
    const conflicting = this.reservations.find(r =>
      r.courtNumber === courtNumber &&
      r.reservationDate.toDateString() === reservationData.reservationDate.toDateString() &&
      r.status !== 'rejected' && r.status !== 'cancelled' &&
      this.isTimeOverlapping(reservationData.startTime, reservationData.endTime, r.startTime, r.endTime)
    );
    if (conflicting) {
      return throwError(() => ({ message: 'Time slot already taken. Please select another time.' }));
    }

    const court = this.courts.find(c => c.courtNumber === courtNumber);
    if (!court || !court.isActive) {
      return throwError(() => ({ message: 'Selected court is not available.' }));
    }

    if (court.maintenanceSchedule) {
      const d = reservationData.reservationDate;
      if (d >= court.maintenanceSchedule.startDate && d <= court.maintenanceSchedule.endDate) {
        return throwError(() => ({ message: 'Court is under maintenance during the selected date.' }));
      }
    }

    const payload = reservationToDb({
      ...reservationData,
      courtNumber,
      courtId: court.supabaseId,
      status: 'pending',
    });

    return from(
      this.supabase.rpc('create_basketball_reservation', { p_data: payload })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const reservation = mapReservation(data);
        this.reservations = [reservation, ...this.reservations.filter(r => r.id !== reservation.id)];
        this.reservationsSubject.next([...this.reservations]);
        return { success: true, message: 'Reservation request submitted successfully' };
      }),
      catchError((rpcErr) => {
        const code = rpcErr?.code || rpcErr?.error?.code;
        const rpcMissing = code === '42883' || code === 'PGRST202' || code === 'PGRST204';
        if (!rpcMissing) {
          return throwError(() => rpcErr);
        }
        return from(
          this.supabase.from('basketball_court_reservations').insert({
            user_id: reservationData.userId,
            court_id: court.supabaseId || null,
            court_number: courtNumber,
            user_name: reservationData.userName,
            user_email: reservationData.userEmail,
            reservation_date: payload['reservation_date'],
            start_time: payload['start_time'],
            end_time: payload['end_time'],
            duration: payload['duration'],
            purpose: payload['purpose'],
            status: 'pending',
            notes: payload['notes'],
          }).select().single()
        ).pipe(
          map(({ data, error }) => {
            if (error) throw error;
            const reservation = mapReservation(data);
            this.reservations = [reservation, ...this.reservations];
            this.reservationsSubject.next([...this.reservations]);
            return { success: true, message: 'Reservation request submitted successfully' };
          })
        );
      })
    );
  }

  updateReservationStatus(
    reservationId: string,
    status: BasketballCourtReservation['status'],
    notes?: string,
    approvedBy?: string
  ): Observable<{ success: boolean; message?: string }> {
    const reservation = this.findReservationById(reservationId);
    if (!reservation) {
      return throwError(() => ({ message: 'Reservation not found' }));
    }

    const updates: Record<string, unknown> = {
      status,
      notes: notes ?? reservation.notes,
    };
    if (approvedBy && (status === 'approved' || status === 'rejected')) {
      updates['approved_at'] = new Date().toISOString();
    }

    return from(
      this.supabase.from('basketball_court_reservations')
        .update(updates)
        .eq('id', reservationId)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        if (data) {
          const updated = mapReservation(data);
          const idx = this.reservations.findIndex(r => r.id === reservationId);
          if (idx >= 0) this.reservations[idx] = updated;
          this.reservationsSubject.next([...this.reservations]);
        }
        return { success: true, message: 'Reservation status updated successfully' };
      }),
      catchError(err => throwError(() => err))
    );
  }

  cancelReservation(reservationId: string, userId: number | string): Observable<{ success: boolean; message?: string }> {
    const reservation = this.reservations.find(
      r => r.id === reservationId && String(r.userId) === String(userId)
    );
    if (!reservation) {
      return throwError(() => ({ message: 'Reservation not found' }));
    }
    if (reservation.status !== 'pending' && reservation.status !== 'approved') {
      return throwError(() => ({ message: 'Cannot cancel this reservation' }));
    }

    return from(
      this.supabase.from('basketball_court_reservations')
        .update({ status: 'cancelled' })
        .eq('id', reservationId)
        .eq('user_id', userId)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        if (data) {
          const updated = mapReservation(data);
          const idx = this.reservations.findIndex(r => r.id === reservationId);
          if (idx >= 0) this.reservations[idx] = updated;
          this.reservationsSubject.next([...this.reservations]);
        }
        return { success: true, message: 'Reservation cancelled successfully' };
      }),
      catchError(err => throwError(() => err))
    );
  }

  private isTimeOverlapping(start1: string, end1: string, start2: string, end2: string): boolean {
    return this.parseTime(start1) < this.parseTime(end2) && this.parseTime(start2) < this.parseTime(end1);
  }

  private parseTime(timeStr: string): number {
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let totalMinutes = hours * 60 + minutes;
    if (period === 'PM' && hours !== 12) totalMinutes += 12 * 60;
    else if (period === 'AM' && hours === 12) totalMinutes -= 12 * 60;
    return totalMinutes;
  }

  getAvailableTimeSlots(courtNumber: number, date: Date): string[] {
    const timeSlots = [
      '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
      '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
      '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM',
    ];
    const bookedSlots = this.reservations
      .filter(r =>
        r.courtNumber === courtNumber &&
        r.reservationDate.toDateString() === date.toDateString() &&
        r.status !== 'rejected' && r.status !== 'cancelled'
      )
      .map(r => r.startTime);
    return timeSlots.filter(slot => !bookedSlots.includes(slot));
  }

  getReservationStats() {
    return {
      total: this.reservations.length,
      pending: this.reservations.filter(r => r.status === 'pending').length,
      approved: this.reservations.filter(r => r.status === 'approved').length,
      completed: this.reservations.filter(r => r.status === 'completed').length,
      rejected: this.reservations.filter(r => r.status === 'rejected').length,
      cancelled: this.reservations.filter(r => r.status === 'cancelled').length,
    };
  }

  getCourtStats(courtNumber: number) {
    const courtReservations = this.reservations.filter(r => r.courtNumber === courtNumber);
    return {
      totalReservations: courtReservations.length,
      pendingReservations: courtReservations.filter(r => r.status === 'pending').length,
      approvedReservations: courtReservations.filter(r => r.status === 'approved').length,
      completedReservations: courtReservations.filter(r => r.status === 'completed').length,
      monthlyRevenue: this.calculateMonthlyRevenue(courtNumber),
    };
  }

  private calculateMonthlyRevenue(courtNumber: number): number {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyReservations = this.reservations.filter(r => {
      const d = new Date(r.reservationDate);
      return r.courtNumber === courtNumber &&
        d.getMonth() === currentMonth &&
        d.getFullYear() === currentYear &&
        r.status === 'completed';
    });
    const court = this.courts.find(c => c.courtNumber === courtNumber);
    if (!court) return 0;
    return monthlyReservations.reduce((total, r) => total + r.duration * court.hourlyRate, 0);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
    });
  }

  formatDateTime(date: Date, time: string): string {
    return `${this.formatDate(date)} at ${time}`;
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-primary-100 text-primary-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'pending': return 'Pending';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  }
}
