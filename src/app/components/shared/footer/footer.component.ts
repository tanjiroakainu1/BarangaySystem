import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
  currentYear = new Date().getFullYear();
  shouldShowFooter = true;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.shouldShowFooter = !this.isDashboardRoute((event as NavigationEnd).url);
      });
    this.shouldShowFooter = !this.isDashboardRoute(this.router.url);
  }

  private isDashboardRoute(url: string): boolean {
    return url.includes('/admin/') || url.includes('/staff/') || url.includes('/user/') || url.includes('/shared/');
  }
}
