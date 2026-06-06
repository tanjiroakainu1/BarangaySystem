import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface BasketballCourtReservation {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  courtNumber: number;
  reservationDate: Date;
  startTime: string;
  endTime: string;
  duration: number; // in hours
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

@Injectable({
  providedIn: 'root'
})
export class BasketballCourtService {
  private reservationsSubject = new BehaviorSubject<BasketballCourtReservation[]>([]);
  public reservations$ = this.reservationsSubject.asObservable();

  private courtsSubject = new BehaviorSubject<BasketballCourt[]>([]);
  public courts$ = this.courtsSubject.asObservable();

  private reservations: BasketballCourtReservation[] = [
    {
      id: 1,
      userId: 3,
      userName: 'Resident User',
      userEmail: 'user@gmail.com',
      courtNumber: 1,
      reservationDate: new Date('2024-01-20'),
      startTime: '6:00 AM',
      endTime: '8:00 AM',
      duration: 2,
      purpose: 'Morning basketball practice',
      status: 'approved',
      notes: 'Regular morning practice session',
      createdAt: new Date('2024-01-18'),
      updatedAt: new Date('2024-01-19'),
      approvedBy: 'Admin User',
      approvedAt: new Date('2024-01-19')
    },
    {
      id: 2,
      userId: 3,
      userName: 'Resident User',
      userEmail: 'user@gmail.com',
      courtNumber: 2,
      reservationDate: new Date('2024-01-21'),
      startTime: '7:00 PM',
      endTime: '9:00 PM',
      duration: 2,
      purpose: 'Community basketball game',
      status: 'pending',
      notes: 'Weekly community game',
      createdAt: new Date('2024-01-19'),
      updatedAt: new Date('2024-01-19')
    }
  ];

  private courts: BasketballCourt[] = [
    {
      id: 1,
      courtNumber: 1,
      name: 'Main Basketball Court',
      location: 'Barangay Sports Complex',
      capacity: 20,
      amenities: ['Lighting', 'Seating', 'Water Station', 'Restroom'],
      hourlyRate: 100,
      isActive: true
    },
    {
      id: 2,
      courtNumber: 2,
      name: 'Secondary Basketball Court',
      location: 'Barangay Sports Complex',
      capacity: 15,
      amenities: ['Lighting', 'Seating', 'Water Station'],
      hourlyRate: 80,
      isActive: true
    },
    {
      id: 3,
      courtNumber: 3,
      name: 'Community Basketball Court',
      location: 'Community Center',
      capacity: 12,
      amenities: ['Lighting', 'Water Station'],
      hourlyRate: 50,
      isActive: true
    }
  ];

  constructor() {
    this.loadDataFromStorage();
    this.reservationsSubject.next(this.reservations);
    this.courtsSubject.next(this.courts);
  }

  private loadDataFromStorage() {
    // Load reservations from localStorage
    const savedReservations = localStorage.getItem('basketballCourtReservations');
    if (savedReservations) {
      this.reservations = JSON.parse(savedReservations).map((reservation: any) => ({
        ...reservation,
        reservationDate: new Date(reservation.reservationDate),
        createdAt: new Date(reservation.createdAt),
        updatedAt: new Date(reservation.updatedAt),
        approvedAt: reservation.approvedAt ? new Date(reservation.approvedAt) : undefined
      }));
    }

    // Load courts from localStorage
    const savedCourts = localStorage.getItem('basketballCourts');
    if (savedCourts) {
      this.courts = JSON.parse(savedCourts).map((court: any) => ({
        ...court,
        maintenanceSchedule: court.maintenanceSchedule ? {
          ...court.maintenanceSchedule,
          startDate: new Date(court.maintenanceSchedule.startDate),
          endDate: new Date(court.maintenanceSchedule.endDate)
        } : undefined
      }));
    }
  }

  private saveReservationsToStorage() {
    localStorage.setItem('basketballCourtReservations', JSON.stringify(this.reservations));
  }

  private saveCourtsToStorage() {
    localStorage.setItem('basketballCourts', JSON.stringify(this.courts));
  }

  // Court Management
  getCourts(): BasketballCourt[] {
    return this.courts.filter(court => court.isActive);
  }

  getAllCourts(): BasketballCourt[] {
    return this.courts;
  }

  getCourtById(courtId: number): BasketballCourt | undefined {
    return this.courts.find(court => court.id === courtId);
  }

  addCourt(courtData: Omit<BasketballCourt, 'id'>): { success: boolean; message?: string } {
    const newCourt: BasketballCourt = {
      id: this.courts.length + 1,
      ...courtData
    };

    this.courts.push(newCourt);
    this.courtsSubject.next(this.courts);
    this.saveCourtsToStorage();
    return { success: true, message: 'Basketball court added successfully' };
  }

  updateCourt(courtId: number, courtData: Partial<BasketballCourt>): { success: boolean; message?: string } {
    const courtIndex = this.courts.findIndex(court => court.id === courtId);
    if (courtIndex !== -1) {
      this.courts[courtIndex] = { ...this.courts[courtIndex], ...courtData };
      this.courtsSubject.next(this.courts);
      this.saveCourtsToStorage();
      return { success: true, message: 'Basketball court updated successfully' };
    }
    return { success: false, message: 'Basketball court not found' };
  }

  deleteCourt(courtId: number): { success: boolean; message?: string } {
    const courtIndex = this.courts.findIndex(court => court.id === courtId);
    if (courtIndex !== -1) {
      this.courts.splice(courtIndex, 1);
      this.courtsSubject.next(this.courts);
      this.saveCourtsToStorage();
      return { success: true, message: 'Basketball court deleted successfully' };
    }
    return { success: false, message: 'Basketball court not found' };
  }

  // Reservation Management
  getReservations(): BasketballCourtReservation[] {
    return this.reservations;
  }

  getUserReservations(userId: number | string): BasketballCourtReservation[] {
    const id = Number(userId);
    return this.reservations.filter(reservation => Number(reservation.userId) === id);
  }

  getCourtReservations(courtNumber: number): BasketballCourtReservation[] {
    return this.reservations.filter(reservation => reservation.courtNumber === courtNumber);
  }

  createReservation(reservationData: Omit<BasketballCourtReservation, 'id' | 'status' | 'createdAt' | 'updatedAt'>): { success: boolean; message?: string } {
    // Check for conflicts
    const conflictingReservation = this.reservations.find(reservation => 
      reservation.courtNumber === reservationData.courtNumber &&
      reservation.reservationDate.toDateString() === reservationData.reservationDate.toDateString() &&
      reservation.status !== 'rejected' && reservation.status !== 'cancelled' &&
      this.isTimeOverlapping(reservationData.startTime, reservationData.endTime, reservation.startTime, reservation.endTime)
    );

    if (conflictingReservation) {
      return { success: false, message: 'Time slot already taken. Please select another time.' };
    }

    // Check if court is available
    const court = this.courts.find(c => c.courtNumber === reservationData.courtNumber);
    if (!court || !court.isActive) {
      return { success: false, message: 'Selected court is not available.' };
    }

    // Check for maintenance
    if (court.maintenanceSchedule) {
      const reservationDate = reservationData.reservationDate;
      const maintenanceStart = court.maintenanceSchedule.startDate;
      const maintenanceEnd = court.maintenanceSchedule.endDate;
      
      if (reservationDate >= maintenanceStart && reservationDate <= maintenanceEnd) {
        return { success: false, message: 'Court is under maintenance during the selected date.' };
      }
    }

    const newReservation: BasketballCourtReservation = {
      id: this.reservations.length + 1,
      ...reservationData,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.reservations.push(newReservation);
    this.reservationsSubject.next(this.reservations);
    this.saveReservationsToStorage();
    return { success: true, message: 'Reservation request submitted successfully' };
  }

  updateReservationStatus(reservationId: number, status: BasketballCourtReservation['status'], notes?: string, approvedBy?: string): { success: boolean; message?: string } {
    const reservationIndex = this.reservations.findIndex(reservation => reservation.id === reservationId);
    if (reservationIndex !== -1) {
      this.reservations[reservationIndex].status = status;
      this.reservations[reservationIndex].updatedAt = new Date();
      
      if (notes) {
        this.reservations[reservationIndex].notes = notes;
      }
      
      if (approvedBy && (status === 'approved' || status === 'rejected')) {
        this.reservations[reservationIndex].approvedBy = approvedBy;
        this.reservations[reservationIndex].approvedAt = new Date();
      }
      
      this.reservationsSubject.next(this.reservations);
      this.saveReservationsToStorage();
      return { success: true, message: 'Reservation status updated successfully' };
    }
    return { success: false, message: 'Reservation not found' };
  }

  cancelReservation(reservationId: number, userId: number): { success: boolean; message?: string } {
    const reservationIndex = this.reservations.findIndex(reservation => 
      reservation.id === reservationId && reservation.userId === userId
    );
    
    if (reservationIndex !== -1) {
      // Only allow cancellation if reservation is pending or approved
      if (this.reservations[reservationIndex].status === 'pending' || 
          this.reservations[reservationIndex].status === 'approved') {
        this.reservations[reservationIndex].status = 'cancelled';
        this.reservations[reservationIndex].updatedAt = new Date();
        this.reservationsSubject.next(this.reservations);
        this.saveReservationsToStorage();
        return { success: true, message: 'Reservation cancelled successfully' };
      } else {
        return { success: false, message: 'Cannot cancel this reservation' };
      }
    }
    return { success: false, message: 'Reservation not found' };
  }

  // Helper methods
  private isTimeOverlapping(start1: string, end1: string, start2: string, end2: string): boolean {
    const time1Start = this.parseTime(start1);
    const time1End = this.parseTime(end1);
    const time2Start = this.parseTime(start2);
    const time2End = this.parseTime(end2);

    return time1Start < time2End && time2Start < time1End;
  }

  private parseTime(timeStr: string): number {
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let totalMinutes = hours * 60 + minutes;
    
    if (period === 'PM' && hours !== 12) {
      totalMinutes += 12 * 60;
    } else if (period === 'AM' && hours === 12) {
      totalMinutes -= 12 * 60;
    }
    
    return totalMinutes;
  }

  getAvailableTimeSlots(courtNumber: number, date: Date): string[] {
    const timeSlots = [
      '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
      '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
      '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM'
    ];

    const bookedSlots = this.reservations
      .filter(reservation => 
        reservation.courtNumber === courtNumber &&
        reservation.reservationDate.toDateString() === date.toDateString() &&
        reservation.status !== 'rejected' && reservation.status !== 'cancelled'
      )
      .map(reservation => reservation.startTime);

    return timeSlots.filter(slot => !bookedSlots.includes(slot));
  }

  getReservationStats() {
    const reservations = this.reservations;
    return {
      total: reservations.length,
      pending: reservations.filter(r => r.status === 'pending').length,
      approved: reservations.filter(r => r.status === 'approved').length,
      completed: reservations.filter(r => r.status === 'completed').length,
      rejected: reservations.filter(r => r.status === 'rejected').length,
      cancelled: reservations.filter(r => r.status === 'cancelled').length
    };
  }

  getCourtStats(courtNumber: number) {
    const courtReservations = this.reservations.filter(r => r.courtNumber === courtNumber);
    return {
      totalReservations: courtReservations.length,
      pendingReservations: courtReservations.filter(r => r.status === 'pending').length,
      approvedReservations: courtReservations.filter(r => r.status === 'approved').length,
      completedReservations: courtReservations.filter(r => r.status === 'completed').length,
      monthlyRevenue: this.calculateMonthlyRevenue(courtNumber)
    };
  }

  private calculateMonthlyRevenue(courtNumber: number): number {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyReservations = this.reservations.filter(reservation => {
      const reservationDate = new Date(reservation.reservationDate);
      return reservation.courtNumber === courtNumber &&
             reservationDate.getMonth() === currentMonth &&
             reservationDate.getFullYear() === currentYear &&
             reservation.status === 'completed';
    });

    const court = this.courts.find(c => c.courtNumber === courtNumber);
    if (!court) return 0;

    return monthlyReservations.reduce((total, reservation) => {
      return total + (reservation.duration * court.hourlyRate);
    }, 0);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  }

  formatDateTime(date: Date, time: string): string {
    const dateStr = this.formatDate(date);
    return `${dateStr} at ${time}`;
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  }
}
