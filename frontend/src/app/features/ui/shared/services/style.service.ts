import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StyleService {

  enableEnglishSubject = new BehaviorSubject<boolean>(false);

  constructor() { }

  changeLanguage(enableMode: boolean) {
    this.enableEnglishSubject.next(enableMode);
  }
}
