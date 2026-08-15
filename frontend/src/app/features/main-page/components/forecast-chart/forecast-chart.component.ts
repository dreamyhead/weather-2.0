import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { ForecastWeather } from '../../../ui/shared/interfaces/ForecastWeather';
import { TranslatePipe } from '../../../ui/shared/pipes/translate.pipe';

const FORECAST_CODES: Record<string, string> = {
  '01': 'SKC', '02': 'FEW', '03': 'SCT', '04': 'BKN',
  '09': 'RA', '10': 'RA', '11': 'TS', '13': 'SN', '50': 'FG',
};

const WEEKDAY_SHORT_RU = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
const WEEKDAY_SHORT_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

interface ChartPoint {
  x: number;
  y: number;
  temp: number;
  code: string;
  label: string;
  showLabel: boolean;
  labelAnchor: 'start' | 'middle' | 'end';
}

interface ChartGridLine {
  y: number;
  label: string;
}

interface ChartTooltip {
  boxX: number;
  boxY: number;
  boxWidth: number;
  boxHeight: number;
  tempX: number;
  codeX: number;
  textY1: number;
  labelX: number;
  textY2: number;
  arrowPoints: string;
}

const CHART_WIDTH = 1000;
const CHART_DEFAULT_HEIGHT = 320;
const CHART_PAD_X = 8;
const CHART_PAD_TOP = 24;
const CHART_PAD_BOTTOM = 40;
const CHART_PAD_LEFT_BASE = 40;

const TOOLTIP_WIDTH_BASE = 156;
const TOOLTIP_HEIGHT_BASE = 72;
const TOOLTIP_GAP_BASE = 14;
const TOOLTIP_ARROW_BASE = 7;

@Component({
  selector: 'forecast-chart',
  templateUrl: './forecast-chart.component.html',
  styleUrls: ['./forecast-chart.component.scss'],
  standalone: true,
  imports: [TranslatePipe]
})
export class ForecastChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() forecastWeather: ForecastWeather | null = null;
  @Input() enableEnglish = false;

  @ViewChild('chartSvg') chartSvgRef?: ElementRef<SVGSVGElement>;
  private chartResizeObserver?: ResizeObserver;

  currentGraph: 'one-day' | 'four-days' = 'one-day';

  chartHeight = CHART_DEFAULT_HEIGHT;
  chartViewBox = `0 0 ${CHART_WIDTH} ${this.chartHeight}`;
  chartBaseline = this.chartHeight - CHART_PAD_BOTTOM;
  chartFontScale = 1;
  chartPadLeft = CHART_PAD_LEFT_BASE;
  chartPoints: ChartPoint[] = [];
  chartGridLines: ChartGridLine[] = [];
  chartLinePath = '';
  chartAreaPath = '';
  hoveredPoint: ChartPoint | null = null;

  constructor(private cdr: ChangeDetectorRef) {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['forecastWeather']) {
      this.buildChart();
    }
  }

  ngAfterViewInit() {
    if (typeof ResizeObserver === 'undefined' || !this.chartSvgRef) {
      return;
    }

    this.chartResizeObserver = new ResizeObserver(([entry]) => {
      if (entry) {
        this.onChartResize(entry.contentRect.width, entry.contentRect.height);
      }
    });
    this.chartResizeObserver.observe(this.chartSvgRef.nativeElement);
  }

  ngOnDestroy() {
    this.chartResizeObserver?.disconnect();
  }

  switchGraph(graph: 'one-day' | 'four-days') {
    this.currentGraph = graph;
    this.buildChart();
  }

  forecastCode(icon: string): string {
    return FORECAST_CODES[icon.slice(0, 2)] ?? 'BKN';
  }

  dayLabel(dt: number): string {
    const weekdays = this.enableEnglish ? WEEKDAY_SHORT_EN : WEEKDAY_SHORT_RU;
    return weekdays[new Date(dt * 1000).getDay()];
  }

  private onChartResize(width: number, height: number) {
    if (width <= 0 || height <= 0) {
      return;
    }

    this.chartFontScale = CHART_WIDTH / width;

    const targetHeight = Math.round(CHART_WIDTH * (height / width));
    if (Math.abs(targetHeight - this.chartHeight) < 2) {
      return;
    }

    this.chartHeight = targetHeight;
    this.chartViewBox = `0 0 ${CHART_WIDTH} ${this.chartHeight}`;
    this.buildChart();
    this.cdr.markForCheck();
  }

  private buildChart() {
    this.hoveredPoint = null;

    if (!this.forecastWeather) {
      this.chartPoints = [];
      this.chartGridLines = [];
      this.chartLinePath = '';
      this.chartAreaPath = '';
      return;
    }

    const innerHeight = this.chartHeight - CHART_PAD_TOP - CHART_PAD_BOTTOM;
    this.chartBaseline = CHART_PAD_TOP + innerHeight;

    const length = this.currentGraph === 'one-day' ? 10 : 40;
    const items = this.forecastWeather.list.slice(0, length);
    const temps = items.map((item) => item.main.temp);
    const rawMin = Math.min(...temps);
    const rawMax = Math.max(...temps);
    const rawRange = rawMax - rawMin || 1;
    const valuePadding = rawRange * 0.12;
    const minTemp = rawMin - valuePadding;
    const maxTemp = rawMax + valuePadding;
    const range = maxTemp - minTemp;

    this.chartPadLeft = CHART_PAD_LEFT_BASE * this.chartFontScale;
    const innerWidth = CHART_WIDTH - this.chartPadLeft - CHART_PAD_X;

    const desiredLabels = this.currentGraph === 'one-day' ? 5 : 6;
    const labelIndices = new Set<number>();
    if (items.length <= desiredLabels) {
      items.forEach((_, i) => labelIndices.add(i));
    } else {
      for (let k = 0; k < desiredLabels; k++) {
        labelIndices.add(Math.round((k * (items.length - 1)) / (desiredLabels - 1)));
      }
    }

    this.chartPoints = items.map((item, i) => {
      const x = this.chartPadLeft + (items.length === 1 ? 0 : (i / (items.length - 1)) * innerWidth);
      const y = CHART_PAD_TOP + innerHeight - ((item.main.temp - minTemp) / range) * innerHeight;
      const date = new Date(item.dt * 1000);
      const label = this.currentGraph === 'one-day'
        ? date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
        : this.dayLabel(item.dt);

      const labelAnchor: ChartPoint['labelAnchor'] = i === 0 ? 'start' : i === items.length - 1 ? 'end' : 'middle';

      return {
        x, y,
        temp: Math.round(item.main.temp),
        code: this.forecastCode(item.weather[0].icon),
        label,
        showLabel: labelIndices.has(i),
        labelAnchor,
      };
    });

    this.chartLinePath = this.chartPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    const first = this.chartPoints[0];
    const last = this.chartPoints[this.chartPoints.length - 1];
    this.chartAreaPath = `${this.chartLinePath} L${last.x},${this.chartBaseline} L${first.x},${this.chartBaseline} Z`;

    const steps = 4;
    this.chartGridLines = Array.from({ length: steps + 1 }, (_, i) => ({
      y: CHART_PAD_TOP + innerHeight - (i / steps) * innerHeight,
      label: `${Math.round(minTemp + (range * i) / steps)}°`,
    }));
  }

  get chartTooltip(): ChartTooltip | null {
    const point = this.hoveredPoint;
    if (!point) {
      return null;
    }

    const scale = this.chartFontScale;
    const tooltipWidth = TOOLTIP_WIDTH_BASE * scale;
    const tooltipHeight = TOOLTIP_HEIGHT_BASE * scale;
    const gap = TOOLTIP_GAP_BASE * scale;
    const arrow = TOOLTIP_ARROW_BASE * scale;
    const inset = 14 * scale;

    const flip = point.y - gap - tooltipHeight < CHART_PAD_TOP;
    const rawBoxY = flip ? point.y + gap : point.y - gap - tooltipHeight;
    const boxY = Math.max(Math.min(Math.max(rawBoxY, 2), this.chartHeight - tooltipHeight - 2), 2);
    const boxX = Math.min(
      Math.max(point.x - tooltipWidth / 2, CHART_PAD_X),
      CHART_WIDTH - CHART_PAD_X - tooltipWidth
    );

    const arrowX = Math.min(Math.max(point.x, boxX + inset), boxX + tooltipWidth - inset);
    const arrowTipY = flip ? boxY : boxY + tooltipHeight;
    const arrowBaseY = flip ? boxY - arrow : boxY + tooltipHeight + arrow;
    const arrowPoints = `${arrowX - arrow},${arrowBaseY} ${arrowX + arrow},${arrowBaseY} ${arrowX},${arrowTipY}`;

    return {
      boxX, boxY,
      boxWidth: tooltipWidth,
      boxHeight: tooltipHeight,
      tempX: boxX + inset,
      codeX: boxX + tooltipWidth - inset,
      textY1: boxY + 34 * scale,
      labelX: boxX + inset,
      textY2: boxY + 56 * scale,
      arrowPoints,
    };
  }
}
