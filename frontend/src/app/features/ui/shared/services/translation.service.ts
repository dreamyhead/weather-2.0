import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private translations = signal<any>({});

  constructor(private http: HttpClient) {}

  loadTranslations(lang: string): Observable<any> {
    return this.http.get(`assets/i18n/${lang}.json`).pipe(
      tap(translations => {
        this.setTranslations(translations);
        document.documentElement.lang = lang;
      })
    );
  }

  setTranslations(translations: any) {
    this.translations.set(translations);
  }

  getTranslation(key: string): string {
    return this.translations()[key] || key;
  }

  changeLanguage(lang: string): void {
    this.loadTranslations(lang).subscribe();
  }
}
