import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-admin-floating-button',
  templateUrl: './admin-floating-button.component.html',
  styleUrls: ['./admin-floating-button.component.scss']
})
export class AdminFloatingButtonComponent implements OnInit {
  isExpanded = false;
  shouldShow = true;

  constructor(private router: Router) {}

  ngOnInit() {
    const setVisibility = (url: string) => {
      this.shouldShow = !this.isDashboardRoute(url) && !url.includes('/admin-login');
    };
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => setVisibility(event.url));
    setVisibility(this.router.url);
  }

  private isDashboardRoute(url: string): boolean {
    return url.includes('/admin/') || url.includes('/staff/') || url.includes('/user/') || url.includes('/shared/');
  }

  toggle() {
    this.isExpanded = !this.isExpanded;
  }
}
