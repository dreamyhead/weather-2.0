import { APP_INITIALIZER, ApplicationConfig, LOCALE_ID, isDevMode, provideZonelessChangeDetection } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import localeRu from '@angular/common/locales/ru';
import { TranslationService } from './features/ui/shared/services/translation.service';

registerLocaleData(localeRu);

export function initializeApp(translationService: TranslationService) {
  return () => translationService.loadTranslations('ru').toPromise();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideHttpClient(withXhr()),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    { provide: LOCALE_ID, useValue: 'ru-RU' },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [TranslationService],
      multi: true,
    },
  ],
};
