import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Chart,
  ChartConfiguration,
  registerables,
} from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-crazy-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="crazy-chart-card rounded-xl border border-primary-200/60 bg-white shadow-md overflow-hidden transition-shadow hover:shadow-xl">
      <div class="crazy-chart-header px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-primary-600 via-primary-700 to-secondary-700">
        <div class="flex items-center justify-between gap-2">
          <h4 class="text-xs sm:text-sm font-bold text-white tracking-wide truncate">{{ title }}</h4>
          <span *ngIf="badge" class="text-[10px] sm:text-xs font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full flex-shrink-0">{{ badge }}</span>
        </div>
        <p *ngIf="subtitle" class="text-[11px] sm:text-xs text-primary-100 mt-0.5 line-clamp-2">{{ subtitle }}</p>
      </div>
      <div class="p-3 sm:p-4" [style.height.px]="chartHeight">
        <canvas #chartCanvas></canvas>
      </div>
    </div>
  `,
  styles: [`
    .crazy-chart-card {
      animation: chartFadeIn 0.6s ease-out;
    }
    @keyframes chartFadeIn {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .crazy-chart-header {
      position: relative;
      overflow: hidden;
    }
    .crazy-chart-header::after {
      content: '';
      position: absolute;
      top: -50%;
      right: -20%;
      width: 120px;
      height: 120px;
      background: rgba(255,255,255,0.08);
      border-radius: 50%;
    }
  `],
})
export class CrazyChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('chartCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  @Input() title = 'Chart';
  @Input() subtitle = '';
  @Input() badge = 'LIVE';
  @Input() height = 280;
  @Input() config!: ChartConfiguration;

  chartHeight = 280;
  private chart?: Chart;

  @HostListener('window:resize')
  onResize(): void {
    this.updateChartHeight();
    this.chart?.resize();
  }

  ngAfterViewInit(): void {
    this.updateChartHeight();
    this.renderChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['height']) {
      this.updateChartHeight();
    }
    if (changes['config'] && !changes['config'].firstChange) {
      this.renderChart();
    }
  }

  private updateChartHeight(): void {
    if (typeof window === 'undefined') {
      this.chartHeight = this.height;
      return;
    }
    const w = window.innerWidth;
    if (w < 480) {
      this.chartHeight = Math.min(this.height, 200);
    } else if (w < 768) {
      this.chartHeight = Math.min(this.height, 240);
    } else if (w < 1024) {
      this.chartHeight = Math.min(this.height, 260);
    } else {
      this.chartHeight = this.height;
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private renderChart(): void {
    if (!this.canvasRef?.nativeElement || !this.config) return;

    this.chart?.destroy();
    const ctx = this.canvasRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      ...this.config,
      options: {
        ...this.config.options,
        responsive: true,
        maintainAspectRatio: false,
      },
    });
  }
}
