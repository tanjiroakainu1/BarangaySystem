import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { SidebarService } from '../../../../services/sidebar.service';

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  private routerSub?: Subscription;

  constructor(public sidebar: SidebarService, private router: Router) {}

  ngOnInit(): void {
    this.routerSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.sidebar.close());
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }
}
