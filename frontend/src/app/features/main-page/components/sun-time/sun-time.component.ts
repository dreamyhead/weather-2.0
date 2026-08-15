import { Component, ElementRef, Input, NgZone, OnChanges, SimpleChanges, ViewChild } from '@angular/core';

@Component({
    selector: 'sun-time',
    templateUrl: './sun-time.component.html',
    styleUrls: ['./sun-time.component.scss'],
    standalone: true
})
export class SunTimeComponent implements OnChanges {
  @Input()
  options?: { sunrise?: number; sunset?: number };

  @ViewChild('sunPathCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  constructor(private ngZone: NgZone) {
  }

  private sunriseMs: number | undefined;
  private sunsetMs: number | undefined;
  private animationFrameId: number | undefined;
  private currentAngle: number = Math.PI;
  private targetAngle: number = Math.PI;
  private isDay: boolean = true;
  private viewReady = false;
  private trackColor = '#6B767E';
  private sunColor = '#F2B33D';
  private moonColor = '#4FD1C5';

  ngOnChanges(changes: SimpleChanges) {
    if (!changes['options']) {
      return;
    }

    if (!this.options || !this.options.sunrise || !this.options.sunset) {
      this.sunriseMs = undefined;
      this.sunsetMs = undefined;
      return;
    }

    this.sunriseMs = this.options.sunrise * 1000;
    this.sunsetMs = this.options.sunset * 1000;

    if (this.viewReady) {
      this.updateTargetAngle();
    }
  }

  ngAfterViewInit() {
    this.viewReady = true;
    this.updateTargetAngle();

    const styles = getComputedStyle(this.canvasRef.nativeElement);
    this.trackColor = styles.getPropertyValue('--wx-ink-soft').trim() || this.trackColor;
    this.sunColor = styles.getPropertyValue('--wx-accent').trim() || this.sunColor;
    this.moonColor = styles.getPropertyValue('--wx-accent-2').trim() || this.moonColor;

    this.ngZone.runOutsideAngular(() => this.animate());
  }

  ngOnDestroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  updateTargetAngle() {
    const now = Date.now();

    if (!this.sunriseMs || !this.sunsetMs) {
      return;
    }

    const dayMs = 24 * 60 * 60 * 1000;
    this.isDay = now >= this.sunriseMs && now <= this.sunsetMs;

    let ratio: number;
    if (this.isDay) {
      ratio = (now - this.sunriseMs) / (this.sunsetMs - this.sunriseMs);
    } else if (now > this.sunsetMs) {
      ratio = (now - this.sunsetMs) / (this.sunriseMs + dayMs - this.sunsetMs);
    } else {
      ratio = (now - (this.sunsetMs - dayMs)) / (this.sunriseMs - (this.sunsetMs - dayMs));
    }

    ratio = Math.min(Math.max(ratio, 0), 1);
    this.targetAngle = Math.PI + ratio * Math.PI;
  }

  private getMoonPhase(date: Date): number {
    const synodicMonthDays = 29.530588853;
    const knownNewMoonUtc = Date.UTC(2000, 0, 6, 18, 14);
    const daysSinceNewMoon = (date.getTime() - knownNewMoonUtc) / 86400000;

    let phase = (daysSinceNewMoon % synodicMonthDays) / synodicMonthDays;
    if (phase < 0) {
      phase += 1;
    }
    return phase;
  }

  private drawMoon(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, phase: number) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.35;
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();

    const waxing = phase <= 0.5;
    const growth = waxing ? phase / 0.5 : (1 - phase) / 0.5;
    const offset = 2 * r * growth;
    const direction = waxing ? -1 : 1;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x + direction * offset, y, r, 0, 2 * Math.PI);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }

  animate() {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    this.updateTargetAngle();

    this.currentAngle += (this.targetAngle - this.currentAngle) * 0.05;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height - 30;
    const radius = cx - 62;

    const trackColor = this.trackColor;
    const bodyColor = this.isDay ? this.sunColor : this.moonColor;

    ctx.beginPath();
    ctx.arc(cx, cy, radius, Math.PI, 2 * Math.PI);
    ctx.closePath();
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = bodyColor;
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.beginPath();
    ctx.setLineDash([2, 4]);
    ctx.moveTo(cx - radius - 14, cy);
    ctx.lineTo(cx + radius + 14, cy);
    ctx.strokeStyle = trackColor;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    ctx.beginPath();
    ctx.arc(cx, cy, radius, Math.PI, 2 * Math.PI);
    ctx.strokeStyle = trackColor;
    ctx.lineWidth = 9;
    ctx.globalAlpha = 0.15;
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.beginPath();
    ctx.arc(cx, cy, radius, Math.PI, 2 * Math.PI);
    ctx.strokeStyle = trackColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();

    const tickCount = 8;
    for (let i = 0; i <= tickCount; i++) {
      const angle = Math.PI + (i / tickCount) * Math.PI;
      const long = i === 0 || i === tickCount || i === tickCount / 2;
      const innerR = radius - (long ? 6 : 4);
      const outerR = radius + (long ? 6 : 4);

      ctx.beginPath();
      ctx.moveTo(cx + innerR * Math.cos(angle), cy + innerR * Math.sin(angle));
      ctx.lineTo(cx + outerR * Math.cos(angle), cy + outerR * Math.sin(angle));
      ctx.strokeStyle = trackColor;
      ctx.lineWidth = long ? 1.5 : 1;
      ctx.globalAlpha = long ? 0.7 : 0.4;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    [cx - radius, cx + radius].forEach((x) => {
      ctx.beginPath();
      ctx.arc(x, cy, 3.5, 0, 2 * Math.PI);
      ctx.fillStyle = trackColor;
      ctx.fill();
    });

    const bodyX = cx + radius * Math.cos(this.currentAngle);
    const bodyY = cy + radius * Math.sin(this.currentAngle);

    ctx.save();
    ctx.shadowColor = bodyColor;
    ctx.shadowBlur = 26;
    if (this.isDay) {
      ctx.beginPath();
      ctx.arc(bodyX, bodyY, 18, 0, 2 * Math.PI);
      ctx.fillStyle = bodyColor;
      ctx.fill();
    } else {
      this.drawMoon(ctx, bodyX, bodyY, 19, bodyColor, this.getMoonPhase(new Date()));
    }
    ctx.restore();

    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }
}
