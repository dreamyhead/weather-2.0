import { Component, Input, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ForecastWeather } from '../../../ui/shared/interfaces/ForecastWeather';
import { TranslatePipe } from '../../../ui/shared/pipes/translate.pipe';
import { TruncatePipe } from '../../../ui/shared/pipes/truncate.pipe';
import { LoaderComponent } from '../loader/loader.component';

const FORECAST_CODES: Record<string, string> = {
  '01': 'SKC', '02': 'FEW', '03': 'SCT', '04': 'BKN',
  '09': 'RA', '10': 'RA', '11': 'TS', '13': 'SN', '50': 'FG',
};

const WEEKDAY_SHORT_RU = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
const WEEKDAY_SHORT_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

interface HourlyItem {
  dt: number;
  temp: number;
  icon: string;
  date: string;
}

interface DailyItem {
  dt: number;
  min: number;
  max: number;
  icon: string;
  date: string;
}

@Component({
    selector: 'forecast-list',
    templateUrl: './forecast-list.component.html',
    styleUrls: ['./forecast-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [DatePipe, TranslatePipe, TruncatePipe, LoaderComponent]
})
export class ForecastListComponent implements OnChanges {
  @Input() forecastWeather: ForecastWeather | null = null;
  @Input() enableEnglish = false;

  hourlyForecast: HourlyItem[] = [];
  dailyForecast: DailyItem[] = [];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['forecastWeather']) {
      this.buildForecastSummaries();
    }
  }

  forecastCode(icon: string): string {
    return FORECAST_CODES[icon.slice(0, 2)] ?? 'BKN';
  }

  dayLabel(dt: number): string {
    const weekdays = this.enableEnglish ? WEEKDAY_SHORT_EN : WEEKDAY_SHORT_RU;
    return weekdays[new Date(dt * 1000).getDay()];
  }

  private buildForecastSummaries() {
    if (!this.forecastWeather) {
      this.hourlyForecast = [];
      this.dailyForecast = [];
      return;
    }

    this.hourlyForecast = this.forecastWeather.list.slice(0, 8).map((item) => ({
      dt: item.dt,
      temp: item.main.temp,
      icon: item.weather[0].icon,
      date: this.formatShortDate(item.dt),
    }));

    const groups = new Map<string, { dt: number; temps: number[]; icons: string[] }>();
    for (const item of this.forecastWeather.list) {
      const key = new Date(item.dt * 1000).toDateString();
      if (!groups.has(key)) {
        groups.set(key, { dt: item.dt, temps: [], icons: [] });
      }
      const group = groups.get(key)!;
      group.temps.push(item.main.temp);
      group.icons.push(item.weather[0].icon);
    }

    this.dailyForecast = Array.from(groups.values()).map((group) => ({
      dt: group.dt,
      min: Math.min(...group.temps),
      max: Math.max(...group.temps),
      icon: group.icons[Math.floor(group.icons.length / 2)],
      date: this.formatShortDate(group.dt),
    }));
  }

  private formatShortDate(dt: number): string {
    const date = new Date(dt * 1000);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}.${month}`;
  }
}
