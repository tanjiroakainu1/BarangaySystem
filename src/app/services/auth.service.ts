import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { mapProfile, profileToDb, ProfileDbRow } from './supabase.mapper';

export interface User {
  id: string | number;
  name?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  suffix?: string;
  phone?: string;
  email: string;
  role: 'admin' | 'staff' | 'user' | 'Resident';
  status?: 'active' | 'inactive';
  address?: string;
  phoneNumber?: string;
  birthDate?: string;
  gender?: string;
  civilStatus?: string;
  nationality?: string;
  purok?: string;
  residentSince?: string;
  password?: string;
  position?: string;
  department?: string;
  employeeId?: string;
  hireDate?: string;
  passwordChangedAt?: string;
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private readonly readyPromise: Promise<void>;

  constructor(private supabase: SupabaseService) {
    this.readyPromise = this.restoreSession();
  }

  /** Wait until Supabase session restore finishes before querying RLS-protected tables */
  whenReady(): Promise<void> {
    return this.readyPromise;
  }

  isStaffOrAdmin(): boolean {
    const role = (this.getCurrentUser()?.role || '').toLowerCase();
    return role === 'admin' || role === 'staff';
  }

  private async restoreSession(): Promise<void> {
    try {
      let session = await this.supabase.getSession();

      if (!session?.user) {
        const { data } = await this.supabase.auth.refreshSession();
        session = data.session;
      }

      if (session?.user) {
        const user = await this.fetchProfile(session.user.id);
        if (user) {
          localStorage.setItem('token', session.access_token);
          localStorage.setItem('user', JSON.stringify(user));
          this.currentUserSubject.next(user);
          return;
        }
      }

      localStorage.removeItem('token');
      localStorage.removeItem('user');
      this.currentUserSubject.next(null);
    } catch (err) {
      console.warn('Session restore failed:', err);
    }
  }

  private async syncProfileFromAuth(userId: string): Promise<void> {
    const { error } = await this.supabase.rpc('sync_profile_from_auth_metadata', {
      p_user_id: userId,
    });
    if (error) {
      console.warn('Profile sync from auth metadata:', error.message);
    }
  }

  private async fetchProfile(userId: string): Promise<User | null> {
    await this.syncProfileFromAuth(userId);
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error || !data) return null;
    return mapProfile(data);
  }

  private saveSession(accessToken: string, user: User): void {
    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    const { email, password } = credentials;
    return from(
      this.supabase.auth.signInWithPassword({ email, password })
    ).pipe(
      switchMap(async ({ data, error }) => {
        if (error || !data.session || !data.user) {
          throw { error: { message: error?.message || 'Login failed. Please check your credentials.' } };
        }
        const profile = await this.fetchProfile(data.user.id);
        if (!profile) {
          throw { error: { message: 'User profile not found. Please contact administrator.' } };
        }
        this.saveSession(data.session.access_token, profile);
        return { token: data.session.access_token, user: profile };
      }),
      catchError(err => throwError(() => err))
    );
  }

  private buildRegistrationMetadata(formData: any, role: string): Record<string, string> {
    return {
      first_name: formData.firstName || '',
      last_name: formData.lastName || '',
      middle_name: formData.middleName || '',
      suffix: formData.suffix || '',
      phone: formData.phone || '',
      address: formData.address || '',
      birth_date: formData.birthDate || '',
      gender: formData.gender || '',
      civil_status: formData.civilStatus || '',
      nationality: formData.nationality || 'Filipino',
      role,
    };
  }

  private buildRegistrationProfileRow(userId: string, formData: any, role: string): ProfileDbRow & { id: string; email: string; role: string } {
    const db = profileToDb({
      firstName: formData.firstName,
      lastName: formData.lastName,
      middleName: formData.middleName,
      suffix: formData.suffix,
      phone: formData.phone,
      address: formData.address,
      birthDate: formData.birthDate || null,
      gender: formData.gender,
      civilStatus: formData.civilStatus,
      nationality: formData.nationality || 'Filipino',
      role: role as User['role'],
    });
    return {
      id: userId,
      email: formData.email,
      role,
      ...db,
    };
  }

  refreshCurrentUser(): Observable<User | null> {
    const current = this.getCurrentUser();
    if (!current?.id) return of(null);

    return from(this.fetchProfile(String(current.id))).pipe(
      map(user => {
        if (user) {
          const token = this.getToken();
          if (token) {
            localStorage.setItem('user', JSON.stringify(user));
            this.currentUserSubject.next(user);
          }
        }
        return user;
      }),
      catchError(() => of(null))
    );
  }

  register(formData: any, options: { autoLogin?: boolean } = {}): Observable<any> {
    const autoLogin = options.autoLogin ?? false;

    return from(this.supabase.getSession()).pipe(
      switchMap(previousSession =>
        from(
          this.supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
              data: this.buildRegistrationMetadata(
                formData,
                formData.role === 'staff' ? 'staff' : formData.role === 'admin' ? 'admin' : 'resident'
              ),
            },
          })
        ).pipe(
          switchMap(async ({ data, error }) => {
            if (error) {
              throw { error: { message: error.message } };
            }
            if (!data.user) {
              throw { error: { message: 'Registration failed.' } };
            }

            const role = formData.role === 'staff' ? 'staff'
              : formData.role === 'admin' ? 'admin'
              : 'resident';

            const profileRow = this.buildRegistrationProfileRow(data.user.id, formData, role);

            if (data.session) {
              const { error: profileError } = await this.supabase
                .from('profiles')
                .upsert(profileRow, { onConflict: 'id' });

              if (profileError) {
                throw { error: { message: profileError.message || 'Failed to save profile information.' } };
              }
            }

            if (autoLogin && data.session) {
              const profile = await this.fetchProfile(data.user.id);
              if (profile) {
                this.saveSession(data.session.access_token, profile);
              }
              return { success: true, user: profile, email: formData.email };
            }

            // Do not keep the new account logged in — user must sign in manually
            await this.supabase.auth.signOut();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            this.currentUserSubject.next(null);

            // Restore admin/staff session when an administrator creates users
            if (previousSession?.access_token && previousSession.refresh_token) {
              const { data: restored } = await this.supabase.auth.setSession({
                access_token: previousSession.access_token,
                refresh_token: previousSession.refresh_token,
              });
              if (restored.session && restored.user) {
                const profile = await this.fetchProfile(restored.user.id);
                if (profile) {
                  this.saveSession(restored.session.access_token, profile);
                }
              }
            }

            return { success: true, email: formData.email };
          })
        )
      ),
      catchError(err => throwError(() => err))
    );
  }

  getAllUsers(): Observable<User[]> {
    return from(
      this.supabase.from('profiles').select('*').order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) return [];
        return (data || []).map(mapProfile);
      }),
      catchError(() => of([]))
    );
  }

  updateUser(id: string | number, userData: any): Observable<any> {
    const dbData: ProfileDbRow = profileToDb(userData);
    if (userData.name && !userData.firstName) {
      const parts = userData.name.split(' ');
      dbData.first_name = parts[0];
      dbData.last_name = parts.slice(1).join(' ');
      dbData.name = userData.name;
    }
    if (userData.role) {
      dbData.role = userData.role === 'Resident' ? 'resident' : userData.role;
    }
    return from(
      this.supabase.from('profiles').update(dbData).eq('id', id).select().single()
    ).pipe(map(({ data, error }) => {
      if (error) throw error;
      return mapProfile(data);
    }));
  }

  deleteUser(id: string | number): Observable<any> {
    return from(
      this.supabase.from('profiles').delete().eq('id', id)
    );
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      const user = JSON.parse(userStr);
      if (user.name && !user.firstName) {
        const parts = user.name.split(' ');
        user.firstName = parts[0];
        user.lastName = parts.slice(1).join(' ');
      }
      return user;
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    this.supabase.auth.signOut();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<{ success: boolean; message: string }> {
    const current = this.getCurrentUser();
    if (!current?.email) {
      return throwError(() => ({ error: { message: 'You must be logged in to change your password.' } }));
    }

    return from(
      this.supabase.auth.signInWithPassword({
        email: current.email,
        password: currentPassword,
      })
    ).pipe(
      switchMap(({ error: signInError }) => {
        if (signInError) {
          return throwError(() => ({ error: { message: 'Current password is incorrect.' } }));
        }
        return from(this.supabase.auth.updateUser({ password: newPassword }));
      }),
      switchMap(({ error: updateError }) => {
        if (updateError) {
          return throwError(() => ({ error: { message: updateError.message } }));
        }
        return from(
          this.supabase.from('profiles')
            .update({ password_changed_at: new Date().toISOString() })
            .eq('id', current.id)
            .select()
            .single()
        );
      }),
      map(({ data, error }) => {
        if (error || !data) throw error;
        const updated = mapProfile(data);
        localStorage.setItem('user', JSON.stringify(updated));
        this.currentUserSubject.next(updated);
        return { success: true, message: 'Password changed successfully.' };
      }),
      catchError(err => throwError(() => err))
    );
  }

  updateProfile(updates: Partial<User> & Record<string, any>): Observable<User | null> {
    const current = this.getCurrentUser();
    if (!current) return of(null);

    const dbUpdates = profileToDb(updates);
    return from(
      this.supabase.from('profiles').update(dbUpdates).eq('id', current.id).select().single()
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) throw error;
        const updated = mapProfile(data);
        localStorage.setItem('user', JSON.stringify(updated));
        this.currentUserSubject.next(updated);
        return updated;
      })
    );
  }
}
