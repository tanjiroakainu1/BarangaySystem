import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface User {
  id: number;
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email: string;
  role: 'admin' | 'staff' | 'user' | 'Resident';
  status?: 'active' | 'inactive';
  address?: string;
  phoneNumber?: string;
  password?: string;
}

/** Demo users for when backend is unavailable. Use real backend in production. */
const DEMO_USERS: { email: string; password: string; role: User['role']; firstName?: string; lastName?: string }[] = [
  { email: 'admin@gmail.com', password: 'admin123', role: 'admin', firstName: 'Admin', lastName: 'User' },
  { email: 'admin@example.com', password: 'admin123', role: 'admin', firstName: 'Luvly', lastName: 'Espiritu' },
  { email: 'col.2023010508@lsb.edu.ph', password: 'admin123', role: 'admin', firstName: 'Cristian', lastName: 'Cayanan' },
  { email: 'staff@gmail.com', password: 'staff123', role: 'staff', firstName: 'Staff', lastName: 'User' },
];

const LOCAL_RESIDENTS_KEY = 'barangay_local_residents';

interface LocalResident {
  user: User;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'https://localhost:44319/api';
  private apiUrl = `${this.baseUrl}/auth`;
  private usersUrl = `${this.baseUrl}/users`;

  private currentUserSubject = new BehaviorSubject<User | null>(this.getCurrentUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  /** Standalone: residents who registered when backend was unavailable (persisted in localStorage). */
  private localResidents: LocalResident[] = [];

  /** OTP store for resident login (email -> 4-digit OTP). */
  private otpStore: Record<string, string> = {};

  constructor(private http: HttpClient) {
    try {
      const stored = localStorage.getItem(LOCAL_RESIDENTS_KEY);
      if (stored) this.localResidents = JSON.parse(stored);
    } catch (_) {}
  }

  private saveLocalResidents(): void {
    try {
      localStorage.setItem(LOCAL_RESIDENTS_KEY, JSON.stringify(this.localResidents));
    } catch (_) {}
  }

  private saveLoginResponse(response: any): void {
    if (response?.token) {
      localStorage.setItem('token', response.token);
    }
    if (response?.user) {
      localStorage.setItem('user', JSON.stringify(response.user));
      this.currentUserSubject.next(response.user);
    }
  }

  /** Generate a 4-digit OTP for the given email (standalone). Returns OTP so UI can display it for demo. */
  generateOtp(email: string): { success: boolean; message: string; otp?: string } {
    const isResident = this.localResidents.some(r => r.user.email === email);
    const isDemo = DEMO_USERS.some(u => u.email === email);
    if (!isResident && !isDemo) {
      return { success: false, message: 'Email not registered.' };
    }
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    this.otpStore[email] = otp;
    return { success: true, message: 'OTP generated.', otp };
  }

  login(credentials: any): Observable<any> {
    const { email, password, otp } = credentials || {};
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: any) => this.saveLoginResponse(response)),
      catchError(() => {
        if (otp != null && otp !== '') {
          const stored = this.otpStore[email];
          if (stored !== otp) {
            return throwError(() => ({ error: { message: 'Invalid OTP. Please try again.' } }));
          }
          delete this.otpStore[email];
        }
        const demo = DEMO_USERS.find(u => u.email === email && u.password === password);
        if (demo) {
          const user: User = {
            id: 0,
            email: demo.email,
            role: demo.role,
            firstName: demo.firstName,
            lastName: demo.lastName,
          };
          const response = { token: 'demo-token', user };
          this.saveLoginResponse(response);
          return of(response);
        }
        const local = this.localResidents.find(r => r.user.email === email && r.password === password);
        if (local) {
          const response = { token: 'demo-token', user: local.user };
          this.saveLoginResponse(response);
          return of(response);
        }
        return throwError(() => ({ error: { message: 'Login failed. Please check your credentials.' } }));
      })
    );
  }

  register(formData: any): Observable<any> {
    const backendPayload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      middleName: formData.middleName,
      suffix: formData.suffix,
      birthDate: formData.birthDate,
      gender: formData.gender,
      civilStatus: formData.civilStatus,
      nationality: formData.nationality,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      role: 'Resident',
      passwordHash: formData.password
    };

    return this.http.post(`${this.apiUrl}/register`, backendPayload).pipe(
      catchError(() => {
        const existing = this.localResidents.some(r => r.user.email === formData.email);
        if (existing) {
          return throwError(() => ({ error: { message: 'Email already registered.' } }));
        }
        const id = this.localResidents.length + 1;
        const user: User = {
          id,
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          address: formData.address,
          role: 'Resident',
        };
        this.localResidents.push({ user, password: formData.password });
        this.saveLocalResidents();
        const response = { token: 'demo-token', user };
        this.saveLoginResponse(response);
        return of(response);
      })
    );
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.usersUrl);
  }

  updateUser(id: number, userData: any): Observable<any> {
    return this.http.put(`${this.usersUrl}/${id}`, userData);
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.usersUrl}/${id}`);
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      const user = JSON.parse(userStr);
      // ✅ PRESERVED: Your name splitting logic
      if (user.name && !user.firstName) {
        const parts = user.name.split(' ');
        user.firstName = parts[0];
        user.lastName = parts.slice(1).join(' ');
      }
      return user;
    } catch (e) {
      return null;
    }
  }

  // ✅ FIX 2: Helper to get the token
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // ✅ FIX 3: Strict Login Check
  // This ensures the "Review" button only works if you have a valid session.
  isLoggedIn(): boolean {
    return !!this.getToken(); 
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  /** Update current user profile (standalone: saves to localStorage and syncs local residents). */
  updateProfile(updates: Partial<User> & { [key: string]: any }): void {
    const current = this.getCurrentUser();
    if (!current) return;
    const updated = { ...current, ...updates };
    localStorage.setItem('user', JSON.stringify(updated));
    this.currentUserSubject.next(updated);
    const local = this.localResidents.find(r => r.user.email === current.email);
    if (local) {
      local.user = { ...local.user, ...updates };
      this.saveLocalResidents();
    }
  }
}