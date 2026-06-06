import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private client: SupabaseClient;

  constructor() {
    this.client = createClient(
      environment.supabase.url,
      environment.supabase.anonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }
    );
  }

  get supabase(): SupabaseClient {
    return this.client;
  }

  get auth() {
    return this.client.auth;
  }

  from(table: string) {
    return this.client.from(table);
  }

  rpc(fn: string, params?: Record<string, unknown>) {
    return this.client.rpc(fn, params);
  }

  async getSession(): Promise<Session | null> {
    const { data } = await this.auth.getSession();
    return data.session;
  }
}
