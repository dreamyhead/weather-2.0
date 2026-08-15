import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { CurrentWeather } from '../interfaces/CurrentWeather';
import { ForecastWeather } from '../interfaces/ForecastWeather';

@Injectable({
  providedIn: 'root'
})
export class RestService {

  constructor(private http: HttpClient) {}

  getCurrentWeather(city: string, language?: string): Observable<CurrentWeather> {
    return this.http.get<CurrentWeather>(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&lang=${language}&appid=${environment.openWeatherApiKey}`)
  };

  getForecastWeather(city: string, language?: string): Observable<ForecastWeather> {
    return this.http.get<ForecastWeather>(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&lang=${language}&appid=${environment.openWeatherApiKey}`)
  };

  getCurrentWeatherByCoords(lat: number, lon: number, language?: string): Observable<CurrentWeather> {
    return this.http.get<CurrentWeather>(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=${language}&appid=${environment.openWeatherApiKey}`)
  };

  getForecastWeatherByCoords(lat: number, lon: number, language?: string): Observable<ForecastWeather> {
    return this.http.get<ForecastWeather>(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=${language}&appid=${environment.openWeatherApiKey}`)
  };
}
