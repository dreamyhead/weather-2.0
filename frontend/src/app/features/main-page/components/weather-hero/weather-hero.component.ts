import { Component, Input } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { CurrentWeather } from '../../../ui/shared/interfaces/CurrentWeather';
import { TranslatePipe } from '../../../ui/shared/pipes/translate.pipe';
import { TruncatePipe } from '../../../ui/shared/pipes/truncate.pipe';
import { SunTimeComponent } from '../sun-time/sun-time.component';
import { LoaderComponent } from '../loader/loader.component';

const FORECAST_CODES: Record<string, string> = {
  '01': 'SKC', '02': 'FEW', '03': 'SCT', '04': 'BKN',
  '09': 'RA', '10': 'RA', '11': 'TS', '13': 'SN', '50': 'FG',
};

@Component({
  selector: 'weather-hero',
  templateUrl: './weather-hero.component.html',
  styleUrls: ['./weather-hero.component.scss'],
  standalone: true,
  imports: [DatePipe, DecimalPipe, TranslatePipe, TruncatePipe, SunTimeComponent, LoaderComponent]
})
export class WeatherHeroComponent {
  @Input() currentWeather: CurrentWeather | null = null;

  forecastCode(icon: string): string {
    return FORECAST_CODES[icon.slice(0, 2)] ?? 'BKN';
  }

  locationLabel(weather: CurrentWeather): string {
    const name = weather.name?.trim();
    const country = weather.sys?.country?.trim();

    if (name) {
      return country ? `${name}, ${country}` : name;
    }

    const { lat, lon } = weather.coord ?? {};
    return lat !== undefined && lon !== undefined ? `${lat.toFixed(2)}, ${lon.toFixed(2)}` : '';
  }

  locationPrefixKey(weather: CurrentWeather): string {
    return weather.name?.trim() ? 'currentTemperature' : 'currentTemperatureAt';
  }
}
