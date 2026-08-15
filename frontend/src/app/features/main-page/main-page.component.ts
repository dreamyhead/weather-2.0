import { Component, ViewChild, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { StyleService } from '../ui/shared/services/style.service';
import { RestService } from '../ui/shared/services/rest.service';
import { CurrentWeather } from '../ui/shared/interfaces/CurrentWeather';
import { ForecastWeather } from '../ui/shared/interfaces/ForecastWeather';
import { SearchInputComponent } from './components/search-input/search-input.component';
import { CardComponent } from './components/card/card.component';
import { WeatherHeroComponent } from './components/weather-hero/weather-hero.component';
import { WeatherMapComponent, MapFocusLocation } from './components/weather-map/weather-map.component';
import { ForecastListComponent } from './components/forecast-list/forecast-list.component';
import { ForecastChartComponent } from './components/forecast-chart/forecast-chart.component';
import { TranslatePipe } from '../ui/shared/pipes/translate.pipe';

@Component({
    selector: 'main-page',
    templateUrl: './main-page.component.html',
    styleUrls: ['./main-page.component.scss'],
    standalone: true,
    imports: [
      CardComponent,
      SearchInputComponent,
      TranslatePipe,
      WeatherHeroComponent,
      WeatherMapComponent,
      ForecastListComponent,
      ForecastChartComponent
    ]
})
export class MainPageComponent {
  forecastWeather = signal<ForecastWeather | null>(null);
  currentWeather = signal<CurrentWeather | null>(null);
  mapFocus = signal<MapFocusLocation | null>(null);
  enableEnglish = toSignal(inject(StyleService).enableEnglishSubject, { initialValue: false });

  @ViewChild(SearchInputComponent)
  searchInputComponent!: SearchInputComponent;

  constructor(private restService: RestService) {
  }

  ngOnInit() {
    this.fetchWeather('Москва', 'ru', false);
  }

  inputCity(city: string) {
    const lang = this.enableEnglish() ? 'en' : 'ru';
    this.fetchWeather(city, lang, true);
  }

  onMapClicked({ lat, lon }: { lat: number; lon: number }) {
    const lang = this.enableEnglish() ? 'en' : 'ru';

    this.restService.getCurrentWeatherByCoords(lat, lon, lang).subscribe({
      next: (data) => {
        this.currentWeather.set(data);
        this.mapFocus.set({ lat, lon, flyTo: false });
        if (this.searchInputComponent && data.name) {
          this.searchInputComponent.inputValue = data.name;
        }
      },
      error: (err) => console.error('Не удалось загрузить текущую погоду', err),
    });

    this.restService.getForecastWeatherByCoords(lat, lon, lang).subscribe({
      next: (data) => this.forecastWeather.set(data),
      error: (err) => console.error('Не удалось загрузить прогноз погоды', err),
    });
  }

  submitSearch() {
    if (this.searchInputComponent) {
      this.searchInputComponent.submit();
    }
  }

  onValueChange(value: string) {
    this.inputCity(value);
  }

  private fetchWeather(city: string, lang: string, flyTo: boolean) {
    this.restService.getCurrentWeather(city, lang).subscribe({
      next: (data) => {
        this.currentWeather.set(data);
        this.mapFocus.set({ lat: data.coord?.lat!, lon: data.coord?.lon!, flyTo });
      },
      error: (err) => console.error('Не удалось загрузить текущую погоду', err),
    });

    this.restService.getForecastWeather(city, lang).subscribe({
      next: (data) => this.forecastWeather.set(data),
      error: (err) => console.error('Не удалось загрузить прогноз погоды', err),
    });
  }
}
