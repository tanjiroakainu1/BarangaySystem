import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SidebarService implements OnDestroy {
  private openSubject = new BehaviorSubject<boolean>(false);
  readonly isOpen$ = this.openSubject.asObservable();

  toggle(): void {
    this.setOpen(!this.openSubject.value);
  }

  open(): void {
    this.setOpen(true);
  }

  close(): void {
    this.setOpen(false);
  }

  get isOpen(): boolean {
    return this.openSubject.value;
  }

  ngOnDestroy(): void {
    this.unlockBodyScroll();
  }

  private setOpen(open: boolean): void {
    this.openSubject.next(open);
    if (typeof document === 'undefined') return;
    if (open && window.innerWidth < 1024) {
      this.lockBodyScroll();
    } else {
      this.unlockBodyScroll();
    }
  }

  private lockBodyScroll(): void {
    document.body.style.overflow = 'hidden';
  }

  private unlockBodyScroll(): void {
    document.body.style.overflow = '';
  }
}
