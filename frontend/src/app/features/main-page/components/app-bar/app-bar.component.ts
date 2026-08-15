import { Component, signal } from '@angular/core';
import { StyleService } from '../../../ui/shared/services/style.service';
import { TranslationService } from '../../../ui/shared/services/translation.service';
import { TranslatePipe } from '../../../ui/shared/pipes/translate.pipe';

@Component({
    selector: 'app-bar',
    templateUrl: './app-bar.component.html',
    styleUrls: ['./app-bar.component.scss'],
    standalone: true,
    imports: [TranslatePipe]
})

export class AppBarComponent {
  enableEnglish = signal(false);

  constructor(
    private styleService: StyleService,
    private translationService: TranslationService
  ) {
  }

  ngOnInit() {
    this.styleService.enableEnglishSubject.subscribe((enableEnglish) => {
      this.enableEnglish.set(enableEnglish);
      this.translationService.changeLanguage(enableEnglish ? 'en' : 'ru');
    });

    this.translationService.changeLanguage('ru');
  }

  changeLanguage(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    const next = !this.enableEnglish();
    this.enableEnglish.set(next);
    this.styleService.changeLanguage(next);
    this.translationService.changeLanguage(next ? 'en' : 'ru');
  }
}
