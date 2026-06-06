import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ChatContext, SYSTEM_PROMPT } from '../config/ai-chat.config';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

@Injectable({ providedIn: 'root' })
export class AiChatService {
  private readonly config = environment.openRouter;

  constructor(private http: HttpClient) {}

  sendMessage(
    userMessage: string,
    history: ChatMessage[],
    context: ChatContext,
    userName?: string
  ): Observable<string> {
    return this.sendMessageStream(userMessage, history, context, userName);
  }

  sendMessageStream(
    userMessage: string,
    history: ChatMessage[],
    context: ChatContext,
    userName?: string
  ): Observable<string> {
    if (!this.config?.apiKey) {
      return throwError(() => new Error('AI assistant is not configured.'));
    }

    const contextNote = this.buildContextNote(context, userName);
    const messages = [
      { role: 'system', content: `${SYSTEM_PROMPT}\n\n${contextNote}` },
      ...history.slice(-12).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMessage },
    ];

    return new Observable<string>(subscriber => {
      const controller = new AbortController();
      let accumulated = '';

      fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'HTTP-Referer': this.config.siteUrl || 'http://localhost:4200',
          'X-Title': this.config.siteName || 'Barangay System',
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          max_tokens: 2048,
          temperature: 0.75,
          stream: true,
        }),
        signal: controller.signal,
      })
        .then(async response => {
          if (!response.ok) {
            let message = 'AI request failed. Please try again.';
            try {
              const err = await response.json();
              message = err?.error?.message || err?.message || message;
            } catch {
              // ignore parse errors
            }
            subscriber.error(new Error(message));
            return;
          }

          const reader = response.body?.getReader();
          if (!reader) {
            subscriber.error(new Error('No response stream from AI.'));
            return;
          }

          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith('data:')) continue;

              const payload = trimmed.slice(5).trim();
              if (!payload || payload === '[DONE]') continue;

              try {
                const parsed = JSON.parse(payload);
                const delta = parsed?.choices?.[0]?.delta?.content;
                if (delta) {
                  accumulated += delta;
                  subscriber.next(accumulated);
                }
              } catch {
                // skip malformed chunks
              }
            }
          }

          if (!accumulated) {
            subscriber.error(new Error('No response from AI.'));
            return;
          }

          subscriber.complete();
        })
        .catch(err => {
          if (err?.name === 'AbortError') return;
          subscriber.error(new Error(err?.message || 'AI request failed. Please try again.'));
        });

      return () => controller.abort();
    }).pipe(
      catchError(err => throwError(() => err))
    );
  }

  /** Non-streaming fallback for environments where fetch streaming fails */
  sendMessageBlocking(
    userMessage: string,
    history: ChatMessage[],
    context: ChatContext,
    userName?: string
  ): Observable<string> {
    if (!this.config?.apiKey) {
      return throwError(() => new Error('AI assistant is not configured.'));
    }

    const contextNote = this.buildContextNote(context, userName);
    const messages = [
      { role: 'system', content: `${SYSTEM_PROMPT}\n\n${contextNote}` },
      ...history.slice(-12).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMessage },
    ];

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
      'HTTP-Referer': this.config.siteUrl || 'http://localhost:4200',
      'X-Title': this.config.siteName || 'Barangay System',
    });

    return this.http.post<any>(
      `${this.config.baseUrl}/chat/completions`,
      {
        model: this.config.model,
        messages,
        max_tokens: 2048,
        temperature: 0.75,
      },
      { headers }
    ).pipe(
      map(res => {
        const content = res?.choices?.[0]?.message?.content;
        if (!content) throw new Error('No response from AI.');
        return content.trim();
      }),
      catchError(err => {
        const msg = err?.error?.error?.message
          || err?.error?.message
          || err?.message
          || 'AI request failed. Please try again.';
        return throwError(() => new Error(msg));
      })
    );
  }

  private buildContextNote(context: ChatContext, userName?: string): string {
    const name = userName ? `The user's name is ${userName}. ` : '';
    const general = 'The user may ask about anything — portal help or any general topic. Answer fully; do not refuse non-portal questions.';
    const map: Record<ChatContext, string> = {
      guest: `${name}Context: Visitor (not logged in). ${general}`,
      home: `${name}Context: Visitor on the home page. ${general}`,
      login: `${name}Context: User is on the login page. ${general}`,
      register: `${name}Context: User is registering a new resident account. ${general}`,
      resident: `${name}Context: Logged-in RESIDENT user. ${general}`,
      staff: `${name}Context: Logged-in STAFF member. ${general}`,
      admin: `${name}Context: Logged-in ADMIN user. ${general}`,
    };
    return map[context] || map.guest;
  }
}
