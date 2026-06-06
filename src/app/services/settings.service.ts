import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';

export interface SystemSettings {
  id?: string;
  barangayName: string;
  barangayCaptain: string;
  contactNumber: string;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private settingsSubject = new BehaviorSubject<SystemSettings | null>(null);
  readonly settings$ = this.settingsSubject.asObservable();

  constructor(private supabase: SupabaseService) {
    this.loadSettings().subscribe();
  }

  private mapRow(row: any): SystemSettings {
    return {
      id: row.id,
      barangayName: row.barangay_name || 'Barangay System',
      barangayCaptain: row.barangay_captain || '',
      contactNumber: row.contact_number || '',
    };
  }

  loadSettings(): Observable<SystemSettings> {
    return from(
      this.supabase.from('system_settings').select('*').limit(1).maybeSingle()
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) {
          return this.defaultSettings();
        }
        const settings = this.mapRow(data);
        this.settingsSubject.next(settings);
        return settings;
      }),
      catchError(() => of(this.defaultSettings()))
    );
  }

  saveSettings(settings: SystemSettings): Observable<SystemSettings> {
    const payload = {
      barangay_name: settings.barangayName,
      barangay_captain: settings.barangayCaptain,
      contact_number: settings.contactNumber,
    };

    const query = settings.id
      ? this.supabase.from('system_settings').update(payload).eq('id', settings.id).select().single()
      : this.supabase.from('system_settings').insert(payload).select().single();

    return from(query).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const mapped = this.mapRow(data);
        this.settingsSubject.next(mapped);
        return mapped;
      })
    );
  }

  private defaultSettings(): SystemSettings {
    const defaults: SystemSettings = {
      barangayName: 'Barangay System',
      barangayCaptain: '',
      contactNumber: '',
    };
    this.settingsSubject.next(defaults);
    return defaults;
  }
}
