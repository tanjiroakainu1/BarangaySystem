import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

// Services
import { CertificateService } from 'src/app/services/certificate.service'; 
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-appointment-request',
  templateUrl: './appointment-request.component.html',
  styleUrls: ['./appointment-request.component.scss']
})
export class AppointmentRequestComponent implements OnInit {
  // --- Form & Step Variables ---
  appointmentForm: FormGroup;
  currentStep = 1;
  isSubmitting = false;
  
  // --- Data Variables ---
  certificateForms: any[] = [];
  selectedForm: any = null;
  currentUser: any = null;

  // --- Popup & Calendar Variables ---
  showForm = true; 
  activePopup: 'year' | 'month' | 'date' | 'time' | null = null;
  
  // Calendar State vars
  yearCalendarPages: any[] = []; 
  currentYearPage = 0;
  monthCalendarGrid: any[] = [];
  calendarYear: number | null = null;
  calendarMonth: string | null = null;
  calendarMonthName: string = '';
  calendarDays: any[] = [];
  weekDays: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  days: any[] = []; 
  availableTimeSlots: string[] = [];

  // --- NEW PREVIEW VARIABLES ---
  showPreview = false;
  previewData: any = null;

  constructor(
    private fb: FormBuilder,
    private certificateService: CertificateService, 
    private authService: AuthService,             
    private router: Router
  ) {
    this.appointmentForm = this.fb.group({
      certificateId: ['', Validators.required],
      requestedDate: ['', Validators.required],
      requestedYear: [''],
      requestedMonth: [''],
      requestedDay: [''],
      requestedTime: ['', Validators.required],
      
      // Personal Info
      date: [new Date().toISOString().split('T')[0], Validators.required],
      firstName: ['', Validators.required],
      middleName: [''],
      lastName: ['', Validators.required],
      address: ['', Validators.required],
      purok: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      gender: ['', Validators.required],
      civilStatus: ['', Validators.required],
      phoneNo: ['', Validators.required],
      residentSince: ['', Validators.required],
      purpose: ['', Validators.required],
      notes: ['']
    });
  }

  ngOnInit(): void {
    // 1. Load User
    this.currentUser = this.authService.getCurrentUser();

    // Fallback: Try to retrieve from localStorage if AuthService returns null/undefined
    if (!this.currentUser) {
       const stored = localStorage.getItem('user'); // Adjust key if needed (e.g., 'currentUser')
       if (stored) {
         try {
           this.currentUser = JSON.parse(stored);
         } catch (e) {
           console.error('Error parsing stored user', e);
         }
       }
    }
    
    if (this.currentUser) {
      this.appointmentForm.patchValue({
        firstName: this.currentUser.firstName,
        lastName: this.currentUser.lastName,
      });
    }

    this.loadCertificates();

    // 2. Initialize Calendar
    this.generateYearPages(); 
    this.generateMonthGrid();
  }

  loadCertificates() {
    this.certificateService.getAll().subscribe({
        next: (data: any) => {
            this.certificateForms = data;
        },
        error: (err: any) => {
            console.error("Failed to load certificates", err);
            this.certificateForms = [
              { id: 1, name: 'Certificate of Residency', fee: 0 },
              { id: 2, name: 'Certificate of Indigency', fee: 0 },
              { id: 3, name: 'Barangay Clearance', fee: 50 }
            ];
        }
    });
  }

  // --- Wizard Navigation ---

  selectCertificate(id: number) {
    this.selectedForm = this.certificateForms.find(f => f.id === id);
    this.appointmentForm.patchValue({ certificateId: id });
    this.nextStep();
  }

  nextStep() { this.currentStep++; }
  previousStep() { this.currentStep--; }
  
  goToStep(step: number) {
    if (step < this.currentStep) this.currentStep = step;
  }

  cancelRequest() {
    this.router.navigate(['/user/dashboard']); 
  }

  // --- SUBMISSION LOGIC ---

  onSubmit() {
    if (this.appointmentForm.valid) {
      // 1. CHECK LOGIN STATUS
      if (!this.currentUser || !this.currentUser.id) {
        alert("You must be LOGGED IN to submit an appointment.\nPlease go to the Login page.");
        // Optional: Redirect to login
        // this.router.navigate(['/login']); 
        return;
      }

      const formData = this.appointmentForm.value;

      this.previewData = {
        // ✅ Ensure UserId is a valid Number
        userId: Number(this.currentUser.id), 
        userEmail: this.currentUser.email || '',
        requester: `${this.currentUser.firstName} ${this.currentUser.lastName}`,
        
        // Ensure CertificateId is a number
        certificateId: this.selectedForm?.id ? Number(this.selectedForm.id) : (Number(formData.certificateId) || 0),
        certificateType: this.selectedForm?.name || 'Certificate',
        
        // Ensure Dates are Strings
        appointmentDate: String(formData.requestedDate), 
        appointmentTime: String(formData.requestedTime),
        
        // Personal Info
        date: formData.date,
        firstName: formData.firstName,
        middleName: formData.middleName || '',
        lastName: formData.lastName,
        address: formData.address,
        purok: formData.purok,
        
        // ✅ FIX: Force String conversion to prevent JSON errors on backend
        dateOfBirth: String(formData.dateOfBirth || ''),
        gender: String(formData.gender || ''),
        civilStatus: String(formData.civilStatus || ''),
        phoneNo: String(formData.phoneNo || ''),
        residentSince: String(formData.residentSince || ''),

        purpose: formData.purpose,
        notes: formData.notes || '',
        
        // Add status for local preview consistency
        status: 'Pending' 
      };

      console.log('Generated Preview Data (Safe):', this.previewData); 
      this.showPreview = true;
    } else {
      this.appointmentForm.markAllAsTouched();
      alert('Please fill in all required fields.');
    }
  }

  confirmSubmission() {
    if (!this.previewData) return;
    
    this.isSubmitting = true;

    this.certificateService.requestAppointment(this.previewData).subscribe({
      next: (response: any) => {
        console.log('Success:', response);
        // Check for success flag OR just a successful HTTP status
        if (response && (response.success || response.success === undefined)) {
          this.showPreview = false;
          alert('Appointment request submitted successfully!');
          this.router.navigate(['/user/dashboard']); 
        } else {
           alert(response?.message || 'Submission failed');
           this.showPreview = false;
        }
      },
      error: (err: any) => {
        console.error('Submission Error Details:', err);
        
        let errorMessage = 'Failed to submit appointment request.';
        
        // Detailed Error Handling for Debugging
        if (err.error && err.error.message) {
             errorMessage = err.error.message;
        } else if (err.error && err.error.errors) {
          const serverErrors = Object.values(err.error.errors).flat().join('\n');
          errorMessage += '\n\nServer Errors:\n' + serverErrors;
        } else if (typeof err.error === 'string') {
           errorMessage += '\n' + err.error;
        } else if (err.status === 400) {
            errorMessage += '\nBad Request: Please check your data.';
        }

        alert(errorMessage);
        this.isSubmitting = false;
        this.showPreview = false; 
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  closePreview() {
    this.showPreview = false;
  }

  // =========================================================
  // CALENDAR LOGIC (Preserved)
  // =========================================================

  // --- Year Logic ---
  generateYearPages() {
    const currentYear = new Date().getFullYear();
    const totalPages = 5; 
    const yearsPerPage = 12;

    this.yearCalendarPages = [];

    for (let i = 0; i < totalPages; i++) {
      const startYear = currentYear + (i * yearsPerPage);
      const endYear = startYear + yearsPerPage - 1;
      const years = [];
      
      for (let y = startYear; y <= endYear; y++) {
        years.push(y);
      }

      this.yearCalendarPages.push({
        startYear: startYear,
        endYear: endYear,
        years: years
      });
    }
    
    this.currentYearPage = 0;
  }

  prevYearPage() {
    if (this.currentYearPage > 0) {
      this.currentYearPage--;
    }
  }

  nextYearPage() {
    if (this.currentYearPage < this.yearCalendarPages.length - 1) {
      this.currentYearPage++;
    }
  }

  selectYear(year: number) {
    this.calendarYear = year;
    this.appointmentForm.patchValue({ requestedYear: year });
    this.activePopup = 'month'; 
  }

  isYearSelected(year: number): boolean {
    return this.calendarYear === year;
  }

  // --- Month Logic ---
  generateMonthGrid() {
    this.monthCalendarGrid = [
      [{ name: 'Jan', value: '01' }, { name: 'Feb', value: '02' }, { name: 'Mar', value: '03' }, { name: 'Apr', value: '04' }],
      [{ name: 'May', value: '05' }, { name: 'Jun', value: '06' }, { name: 'Jul', value: '07' }, { name: 'Aug', value: '08' }],
      [{ name: 'Sep', value: '09' }, { name: 'Oct', value: '10' }, { name: 'Nov', value: '11' }, { name: 'Dec', value: '12' }]
    ];
  }

  getSelectedMonthName() {
    if (!this.appointmentForm.get('requestedMonth')?.value) return 'Not selected';
    const flatMonths = this.monthCalendarGrid.flat();
    const found = flatMonths.find(m => m.value === this.appointmentForm.get('requestedMonth')?.value);
    return found ? found.name : 'Not selected';
  }

  selectMonth(monthVal: string) {
    this.calendarMonth = monthVal;
    
    const flatMonths = this.monthCalendarGrid.flat();
    const found = flatMonths.find(m => m.value === monthVal);
    this.calendarMonthName = found ? found.name : '';

    this.appointmentForm.patchValue({ requestedMonth: monthVal });
    
    this.generateDays();
    this.activePopup = 'date';
  }

  isMonthSelected(monthVal: string): boolean {
    return this.appointmentForm.get('requestedMonth')?.value === monthVal;
  }

  // --- Day Logic ---
  generateDays() {
    if (!this.calendarYear || !this.calendarMonth) return;

    const year = this.calendarYear;
    const monthIndex = parseInt(this.calendarMonth, 10) - 1; 
    
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay(); 

    this.calendarDays = [];

    for (let i = 0; i < startDay; i++) {
      this.calendarDays.push({ day: null, isCurrentMonth: false, isAvailable: false });
    }

    const today = new Date();
    today.setHours(0,0,0,0);

    for (let i = 1; i <= daysInMonth; i++) {
      const dateToCheck = new Date(year, monthIndex, i);
      const isPast = dateToCheck < today;
      const isWeekend = dateToCheck.getDay() === 0 || dateToCheck.getDay() === 6;
      
      this.calendarDays.push({
        day: i,
        date: dateToCheck,
        isCurrentMonth: true,
        isAvailable: !isPast && !isWeekend 
      });
    }
    
    this.days = this.calendarDays; 
  }

  selectCalendarDate(dayData: any) {
    if (!dayData.isAvailable) return;

    this.appointmentForm.patchValue({ requestedDay: dayData.day });
    
    const m = this.calendarMonth;
    const d = dayData.day.toString().padStart(2, '0');
    const fullDate = `${this.calendarYear}-${m}-${d}`;
    
    this.appointmentForm.patchValue({ requestedDate: fullDate });

    this.availableTimeSlots = [
      '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
      '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
    ];
    
    this.activePopup = 'time';
  }

  isDateSelected(dayData: any): boolean {
    return this.appointmentForm.get('requestedDay')?.value === dayData.day;
  }

  isDateAvailable(dayData: any): boolean {
    return dayData.isCurrentMonth && dayData.isAvailable;
  }

  selectTime(time: string) {
    this.appointmentForm.patchValue({ requestedTime: time });
    this.activePopup = null; 
  }
}