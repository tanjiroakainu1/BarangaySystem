import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BasketballCourtService, BasketballCourt, BasketballCourtReservation } from '../../../../services/basketball-court.service';
import { AuthService, User } from '../../../../services/auth.service';

@Component({
  selector: 'app-basketball-court-reservation',
  templateUrl: './basketball-court-reservation.component.html',
  styleUrls: ['./basketball-court-reservation.component.scss']
})
export class BasketballCourtReservationComponent implements OnInit {
  courts: BasketballCourt[] = [];
  reservations: BasketballCourtReservation[] = [];
  reservationForm: FormGroup;
  isSubmitting = false;
  showForm = false;
  selectedCourt: BasketballCourt | null = null;
  availableTimeSlots: string[] = [];
  currentUser: User | null = null;
  userReservations: BasketballCourtReservation[] = [];

  constructor(
    private basketballCourtService: BasketballCourtService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.reservationForm = this.fb.group({
      courtNumber: ['', Validators.required],
      reservationDate: ['', Validators.required],
      startTime: ['', Validators.required],
      duration: ['', [Validators.required, Validators.min(1), Validators.max(4)]],
      purpose: ['', [Validators.required, Validators.minLength(10)]],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.basketballCourtService.courts$.subscribe(courts => {
      this.courts = courts.filter(c => c.isActive);
    });

    this.basketballCourtService.reservations$.subscribe(reservations => {
      this.reservations = reservations;
      if (this.currentUser) {
        this.loadUserReservations(this.currentUser.id);
      }
    });

    this.authService.refreshCurrentUser().subscribe();
    this.authService.currentUser$.subscribe((user: User | null) => {
      this.currentUser = user;
      if (user) {
        this.loadUserReservations(user.id);
      }
    });
  }

  loadUserReservations(userId: number | string) {
    this.userReservations = this.basketballCourtService.getUserReservations(userId);
  }

  selectCourt(courtNumber: number) {
    this.selectedCourt = this.basketballCourtService.getCourtById(courtNumber) || null;
    this.showForm = true;
    this.reservationForm.patchValue({ courtNumber });
    this.availableTimeSlots = [];
  }

  onDateChange() {
    const selectedDate = this.reservationForm.get('reservationDate')?.value;
    const courtNumber = this.reservationForm.get('courtNumber')?.value;
    
    if (selectedDate && courtNumber) {
      const date = new Date(selectedDate);
      this.availableTimeSlots = this.basketballCourtService.getAvailableTimeSlots(courtNumber, date);
      this.reservationForm.patchValue({ startTime: '' });
    }
  }

  onStartTimeChange() {
    const startTime = this.reservationForm.get('startTime')?.value;
    const duration = this.reservationForm.get('duration')?.value;
    
    if (startTime && duration) {
      const endTime = this.calculateEndTime(startTime, duration);
      this.reservationForm.patchValue({ endTime });
    }
  }

  onDurationChange() {
    const startTime = this.reservationForm.get('startTime')?.value;
    const duration = this.reservationForm.get('duration')?.value;
    
    if (startTime && duration) {
      const endTime = this.calculateEndTime(startTime, duration);
      this.reservationForm.patchValue({ endTime });
    }
  }

  private calculateEndTime(startTime: string, duration: number): string {
    const [time, period] = startTime.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    
    let totalMinutes = hours * 60 + minutes;
    if (period === 'PM' && hours !== 12) {
      totalMinutes += 12 * 60;
    } else if (period === 'AM' && hours === 12) {
      totalMinutes -= 12 * 60;
    }
    
    totalMinutes += duration * 60;
    
    let endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    
    let endPeriod = 'AM';
    if (endHours >= 12) {
      endPeriod = 'PM';
      if (endHours > 12) {
        endHours -= 12;
      }
    }
    if (endHours === 0) {
      endHours = 12;
    }
    
    return `${endHours}:${endMinutes.toString().padStart(2, '0')} ${endPeriod}`;
  }

  onSubmit() {
    if (!this.currentUser) {
      alert('Please log in to reserve a basketball court.');
      return;
    }

    if (!this.reservationForm.valid) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting = true;

    const formData = this.reservationForm.value;
    const reservationDate = new Date(formData.reservationDate + 'T12:00:00');
    const duration = Number(formData.duration);
    const endTime = this.calculateEndTime(formData.startTime, duration);

    const reservationData = {
      userId: this.currentUser.id,
      userName: `${this.currentUser.firstName || ''} ${this.currentUser.lastName || ''}`.trim() || this.currentUser.name || 'Resident',
      userEmail: this.currentUser.email,
      courtNumber: Number(formData.courtNumber),
      reservationDate,
      startTime: formData.startTime,
      endTime,
      duration,
      purpose: formData.purpose,
      notes: formData.notes || '',
    };

    this.basketballCourtService.createReservation(reservationData).subscribe({
      next: () => {
        alert('Basketball court reservation submitted successfully! You will be notified of the status.');
        this.resetForm();
        this.isSubmitting = false;
      },
      error: (err) => {
        alert(err?.message || 'Failed to submit reservation request');
        this.isSubmitting = false;
      },
    });
  }

  cancelReservation(reservationId: string) {
    if (!this.currentUser) return;

    if (confirm('Are you sure you want to cancel this reservation?')) {
      this.basketballCourtService.cancelReservation(reservationId, this.currentUser.id).subscribe({
        next: () => alert('Reservation cancelled successfully'),
        error: (err) => alert(err?.message || 'Failed to cancel reservation'),
      });
    }
  }

  resetForm() {
    this.reservationForm.reset();
    this.showForm = false;
    this.selectedCourt = null;
    this.availableTimeSlots = [];
  }

  cancelRequest() {
    this.resetForm();
  }

  private markFormGroupTouched() {
    Object.keys(this.reservationForm.controls).forEach(key => {
      const control = this.reservationForm.get(key);
      control?.markAsTouched();
    });
  }

  getMinDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  getMaxDate(): string {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 2); // 2 months ahead
    return maxDate.toISOString().split('T')[0];
  }

  getStatusBadgeClass(status: string): string {
    return this.basketballCourtService.getStatusBadgeClass(status);
  }

  getStatusText(status: string): string {
    return this.basketballCourtService.getStatusText(status);
  }

  formatDate(date: Date): string {
    return this.basketballCourtService.formatDate(date);
  }

  formatDateTime(date: Date, time: string): string {
    return this.basketballCourtService.formatDateTime(date, time);
  }

  canCancelReservation(reservation: BasketballCourtReservation): boolean {
    return reservation.status === 'pending' || reservation.status === 'approved';
  }

  getTotalCost(duration: number, courtNumber: number): number {
    const court = this.courts.find(c => c.courtNumber === courtNumber);
    return court ? duration * court.hourlyRate : 0;
  }
}
