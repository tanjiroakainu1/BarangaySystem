import { Component, OnInit } from '@angular/core';
import { BasketballCourtService, BasketballCourtReservation, BasketballCourt } from '../../../../services/basketball-court.service';

@Component({
  selector: 'app-appointment-management',
  templateUrl: './appointment-management.component.html',
  styleUrls: ['./appointment-management.component.scss']
})
export class AppointmentManagementComponent implements OnInit {
  reservations: BasketballCourtReservation[] = [];
  filteredReservations: BasketballCourtReservation[] = [];
  courts: BasketballCourt[] = [];
  searchTerm = '';
  selectedStatus = 'all';

  constructor(private basketballCourtService: BasketballCourtService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.reservations = this.basketballCourtService.getReservations();
    this.courts = this.basketballCourtService.getAllCourts();
    this.filterReservations();
  }

  onSearchChange(): void {
    this.filterReservations();
  }

  onStatusFilterChange(): void {
    this.filterReservations();
  }

  filterReservations(): void {
    const term = this.searchTerm.toLowerCase().trim();
    const status = this.selectedStatus === 'all' ? '' : this.selectedStatus;
    this.filteredReservations = this.reservations.filter(reservation => {
      const matchesSearch = !term ||
        (reservation.userName?.toLowerCase().includes(term)) ||
        (reservation.userEmail?.toLowerCase().includes(term)) ||
        (reservation.purpose?.toLowerCase().includes(term)) ||
        (String(reservation.courtNumber).includes(term)) ||
        (this.getCourtName(reservation.courtNumber).toLowerCase().includes(term));
      const resStatus = (reservation.status || '').toLowerCase();
      const matchesStatus = !status || resStatus === status;
      return matchesSearch && matchesStatus;
    });
  }

  getCourtName(courtNumber: number): string {
    const court = this.courts.find(c => c.courtNumber === courtNumber);
    return court ? court.name : `Court ${courtNumber}`;
  }

  getStatusText(status: string): string {
    return this.basketballCourtService.getStatusText(status);
  }

  getStatusBadgeClass(status: string): string {
    return this.basketballCourtService.getStatusBadgeClass(status);
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    const d = date instanceof Date ? date : new Date(date);
    return this.basketballCourtService.formatDate(d);
  }

  formatDateTime(date: Date | string | undefined, time: string | undefined): string {
    if (!date) return 'N/A';
    const d = date instanceof Date ? date : new Date(date);
    return time ? this.basketballCourtService.formatDateTime(d, time) : this.basketballCourtService.formatDate(d);
  }

  updateReservationStatus(reservationId: number, status: BasketballCourtReservation['status']): void {
    const result = this.basketballCourtService.updateReservationStatus(
      reservationId,
      status,
      undefined,
      'Admin'
    );
    if (result.success) {
      this.loadData();
    }
  }
}
