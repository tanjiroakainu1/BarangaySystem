import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  HostListener,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { AiChatService, ChatMessage } from '../../../services/ai-chat.service';
import { AiChatUiService } from '../../../services/ai-chat-ui.service';
import { AuthService } from '../../../services/auth.service';
import { AI_CHAT_COPY, ChatContext, QUICK_QUESTIONS } from '../../../config/ai-chat.config';

@Component({
  selector: 'app-floating-ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './floating-ai-chat.component.html',
  styleUrls: ['./floating-ai-chat.component.scss']
})
export class FloatingAiChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesEnd') messagesEnd?: ElementRef<HTMLDivElement>;
  @ViewChild('chatInput') chatInput?: ElementRef<HTMLTextAreaElement>;

  isOpen = false;
  isMinimized = false;
  isLoading = false;
  isDocked = false;
  inputText = '';
  context: ChatContext = 'guest';
  quickQuestions: string[] = [];
  messages: ChatMessage[] = [];
  errorText = '';
  readonly copy = AI_CHAT_COPY;

  private routerSub?: Subscription;
  private chatSub?: Subscription;
  private shouldScroll = false;

  constructor(
    private aiChat: AiChatService,
    private aiUi: AiChatUiService,
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.updateContext(this.router.url);
    this.updateDockState();

    this.routerSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e) => this.updateContext((e as NavigationEnd).url));

    this.messages.push({
      role: 'assistant',
      content: AI_CHAT_COPY.welcome,
      timestamp: new Date(),
    });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    this.chatSub?.unsubscribe();
    this.aiUi.setOpen(false);
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updateDockState();
    if (this.isOpen) {
      this.aiUi.onViewportChange(true);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen) {
      this.close();
    }
  }

  private updateDockState(): void {
    if (typeof window === 'undefined') return;
    this.isDocked = window.innerWidth >= this.aiUi.dockBreakpoint;
  }

  private updateContext(url: string): void {
    const user = this.auth.getCurrentUser();
    const role = (user?.role || '').toLowerCase();

    if (url.includes('/admin/')) {
      this.context = 'admin';
    } else if (url.includes('/staff/')) {
      this.context = 'staff';
    } else if (url.includes('/user/')) {
      this.context = 'resident';
    } else if (url.includes('/login')) {
      this.context = 'login';
    } else if (url.includes('/register')) {
      this.context = 'register';
    } else if (url === '/' || url.includes('/home')) {
      this.context = user ? (role === 'admin' ? 'admin' : role === 'staff' ? 'staff' : 'resident') : 'home';
    } else {
      this.context = user
        ? (role === 'admin' ? 'admin' : role === 'staff' ? 'staff' : 'resident')
        : 'guest';
    }

    this.quickQuestions = QUICK_QUESTIONS[this.context] || QUICK_QUESTIONS.guest;
  }

  toggleChat(): void {
    this.updateDockState();
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.isMinimized = false;
      this.aiUi.setOpen(true);
      setTimeout(() => this.chatInput?.nativeElement?.focus(), 120);
    } else {
      this.aiUi.setOpen(false);
    }
  }

  minimize(): void {
    this.isMinimized = true;
  }

  restore(): void {
    this.isMinimized = false;
    setTimeout(() => this.chatInput?.nativeElement?.focus(), 80);
  }

  close(): void {
    this.isOpen = false;
    this.isMinimized = false;
    this.aiUi.setOpen(false);
    this.chatSub?.unsubscribe();
    this.isLoading = false;
  }

  askQuick(question: string): void {
    this.inputText = question;
    this.send();
  }

  send(): void {
    const text = this.inputText.trim();
    if (!text || this.isLoading) return;

    this.errorText = '';
    this.messages.push({ role: 'user', content: text, timestamp: new Date() });
    this.inputText = '';
    this.isLoading = true;
    this.shouldScroll = true;

    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };
    this.messages.push(assistantMessage);
    const assistantIndex = this.messages.length - 1;

    const user = this.auth.getCurrentUser();
    const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : undefined;

    this.chatSub?.unsubscribe();
    this.chatSub = this.aiChat.sendMessage(
      text,
      this.messages.slice(0, -2),
      this.context,
      userName
    ).subscribe({
      next: (reply) => {
        this.messages[assistantIndex] = {
          ...this.messages[assistantIndex],
          content: reply,
        };
        this.shouldScroll = true;
        this.cdr.markForCheck();
      },
      complete: () => {
        this.isLoading = false;
        this.shouldScroll = true;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.messages.splice(assistantIndex, 1);
        this.errorText = err.message || 'Something went wrong.';
        this.isLoading = false;
        this.shouldScroll = true;
        this.cdr.markForCheck();
      }
    });
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  clearChat(): void {
    this.chatSub?.unsubscribe();
    this.isLoading = false;
    this.messages = [{
      role: 'assistant',
      content: AI_CHAT_COPY.cleared,
      timestamp: new Date(),
    }];
    this.errorText = '';
  }

  get contextLabel(): string {
    const labels: Record<ChatContext, string> = {
      guest: 'Visitor',
      home: 'Home',
      login: 'Login',
      register: 'Register',
      resident: 'Resident',
      staff: 'Staff',
      admin: 'Admin',
    };
    return labels[this.context];
  }

  formatTime(d: Date): string {
    return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatContent(text: string): string {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  }

  private scrollToBottom(): void {
    const el = this.messagesEnd?.nativeElement;
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }
}
