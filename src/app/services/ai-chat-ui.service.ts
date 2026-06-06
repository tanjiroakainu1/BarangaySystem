import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AiChatUiService implements OnDestroy {
  readonly panelWidth = 380;
  readonly dockBreakpoint = 768;

  readonly isOpen$ = new BehaviorSubject(false);

  ngOnDestroy(): void {
    this.setOpen(false);
  }

  setOpen(open: boolean): void {
    this.isOpen$.next(open);
    this.syncBody(open);
  }

  onViewportChange(isOpen: boolean): void {
    if (isOpen) {
      this.syncBody(true);
    }
  }

  private syncBody(open: boolean): void {
    if (typeof document === 'undefined') return;

    const docked = open && window.innerWidth >= this.dockBreakpoint;
    document.body.classList.toggle('ai-chat-docked', docked);
    document.body.classList.toggle('ai-chat-sheet-open', open && !docked);
    document.documentElement.style.setProperty('--ai-panel-width', `${this.panelWidth}px`);
  }
}
