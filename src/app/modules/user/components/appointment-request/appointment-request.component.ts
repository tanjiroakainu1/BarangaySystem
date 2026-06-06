import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

// Services
import { CertificateService } from 'src/app/services/certificate.service';
import { AuthService, User } from 'src/app/services/auth.service';
import { profileToAppointmentForm } from 'src/app/services/supabase.mapper';

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
  currentUser: User | null = null;
  profilePrefilled = false;
  isLoadingProfile = true;

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
      residentSince: ['', [Validators.required, Validators.min(1900), Validators.max(new Date().getFullYear())]],
      purpose: ['', Validators.required],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.authService.refreshCurrentUser().subscribe({
      next: (user) => {
        if (user) this.patchFormFromProfile(user);
        this.isLoadingProfile = false;
      },
      error: () => { this.isLoadingProfile = false; },
    });

    this.authService.currentUser$.subscribe(user => {
      if (user) this.patchFormFromProfile(user);
    });

    this.loadCertificates();

    // 2. Initialize Calendar
    this.generateYearPages(); 
    this.generateMonthGrid();
  }

  private patchFormFromProfile(user: User): void {
    this.currentUser = user;
    const patch = profileToAppointmentForm(user);
    this.appointmentForm.patchValue({
      ...patch,
      residentSince: patch['residentSince'] ? Number(patch['residentSince']) : '',
    });
    this.profilePrefilled = Object.values(patch).some(value => !!value);
  }

  private saveProfileFromAppointment(formData: {
    firstName?: string;
    middleName?: string;
    lastName?: string;
    address?: string;
    dateOfBirth?: string;
    gender?: string;
    civilStatus?: string;
    phoneNo?: string;
    purok?: string;
    residentSince?: string;
  }): void {
    if (!this.currentUser?.id) return;

    this.authService.updateProfile({
      firstName: formData.firstName,
      middleName: formData.middleName,
      lastName: formData.lastName,
      address: formData.address,
      birthDate: formData.dateOfBirth,
      gender: formData.gender,
      civilStatus: formData.civilStatus,
      phone: formData.phoneNo,
      purok: formData.purok,
      residentSince: formData.residentSince,
    }).subscribe();
  }

  loadCertificates() {
    this.certificateService.getAll().subscribe({
        next: (data: any) => {
            this.certificateForms = data;
        },
        error: (err: any) => {
            console.error("Failed to load certificates", err);
            this.certificateForms = [];
        }
    });
  }

  // --- Wizard Navigation ---

  get hasAppointmentSchedule(): boolean {
    return !!(
      this.appointmentForm.get('requestedDate')?.value &&
      this.appointmentForm.get('requestedTime')?.value
    );
  }

  get canProceedFromStep2(): boolean {
    return this.hasAppointmentSchedule;
  }

  get canReviewRequest(): boolean {
    if (this.isSubmitting || !this.hasAppointmentSchedule) return false;

    const requiredFields = [
      'certificateId', 'date', 'firstName', 'lastName', 'address', 'purok',
      'dateOfBirth', 'gender', 'civilStatus', 'phoneNo', 'residentSince', 'purpose',
    ];

    return requiredFields.every(name => this.appointmentForm.get(name)?.valid);
  }

  get submitBlockingReasons(): string[] {
    const reasons: string[] = [];
    if (!this.hasAppointmentSchedule) {
      reasons.push('Select an appointment date and time in Step 2.');
    }

    const labels: Record<string, string> = {
      certificateId: 'Certificate',
      date: 'Date of request',
      firstName: 'First name',
      lastName: 'Last name',
      address: 'Address',
      purok: 'Purok',
      dateOfBirth: 'Date of birth',
      gender: 'Gender',
      civilStatus: 'Civil status',
      phoneNo: 'Phone number',
      residentSince: 'Resident since',
      purpose: 'Purpose',
    };

    for (const [name, label] of Object.entries(labels)) {
      const control = this.appointmentForm.get(name);
      if (control?.invalid) reasons.push(`${label} is required.`);
    }

    return reasons;
  }

  selectCertificate(id: string | number) {
    this.selectedForm = this.certificateForms.find(f => String(f.id) === String(id));
    this.appointmentForm.patchValue({ certificateId: id });
    this.nextStep();
  }

  nextStep() {
    if (this.currentStep === 2 && !this.canProceedFromStep2) {
      alert('Please select an appointment date and time before continuing.');
      this.activePopup = 'year';
      return;
    }

    this.currentStep++;
    if (this.currentStep === 3) {
      this.restoreTimeSlotsIfNeeded();
      this.prefillPersonalInfoFromProfile();
    }
  }

  continueToPersonalInfo(): void {
    this.nextStep();
  }

  previousStep() { this.currentStep--; }

  goToStep(step: number) {
    if (step < this.currentStep) {
      this.currentStep = step;
      if (step === 3) {
        this.restoreTimeSlotsIfNeeded();
        this.prefillPersonalInfoFromProfile();
      }
    }
  }

  private restoreTimeSlotsIfNeeded(): void {
    const date = this.appointmentForm.get('requestedDate')?.value;
    if (date) {
      this.availableTimeSlots = this.certificateService.getAvailableTimeSlots(date);
    }
  }

  private prefillPersonalInfoFromProfile(): void {
    this.authService.refreshCurrentUser().subscribe(user => {
      if (user) this.patchFormFromProfile(user);
    });
  }

  cancelRequest() {
    this.router.navigate(['/user/dashboard']); 
  }

  // --- SUBMISSION LOGIC ---

  onSubmit() {
    this.appointmentForm.markAllAsTouched();

    if (!this.hasAppointmentSchedule) {
      alert('Please go back to Step 2 and select an appointment date and time.');
      this.currentStep = 2;
      this.activePopup = 'year';
      return;
    }

    if (this.canReviewRequest) {
      // 1. CHECK LOGIN STATUS
      if (!this.currentUser || !this.currentUser.id) {
        alert("You must be LOGGED IN to submit an appointment.\nPlease go to the Login page.");
        // Optional: Redirect to login
        // this.router.navigate(['/login']); 
        return;
      }

      const formData = this.appointmentForm.value;

      this.previewData = {
        userId: this.currentUser.id,
        userEmail: this.currentUser.email || '',
        userName: `${this.currentUser.firstName} ${this.currentUser.lastName}`,
        requester: `${this.currentUser.firstName} ${this.currentUser.lastName}`,
        certificateId: this.selectedForm?.id || formData.certificateId,
        certificateType: this.selectedForm?.name || 'Certificate',
        
        requestedDate: String(formData.requestedDate),
        requestedTime: String(formData.requestedTime),
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
        
        status: 'pending',
      };

      console.log('Generated Preview Data (Safe):', this.previewData); 
      this.showPreview = true;
    } else {
      const reasons = this.submitBlockingReasons;
      alert(reasons.length
        ? `Please complete the following:\n\n• ${reasons.join('\n• ')}`
        : 'Please fill in all required fields.');
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
          this.saveProfileFromAppointment(this.previewData);
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

        if (err?.message) {
          errorMessage = err.message;
        } else if (err?.error?.message) {
          errorMessage = err.error.message;
        } else if (err?.details) {
          errorMessage = err.details;
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

    this.availableTimeSlots = this.certificateService.getAvailableTimeSlots(fullDate);
    
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