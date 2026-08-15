import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'search-input',
    templateUrl: './search-input.component.html',
    styleUrls: ['./search-input.component.scss'],
    standalone: true,
    imports: [FormsModule]
})
export class SearchInputComponent {

  @Input()
  label?: string;

  @Output()
  valueChange: EventEmitter<string> = new EventEmitter<string>();

  @Output()
  submitClick: EventEmitter<void> = new EventEmitter<void>();

  inputValue: string = '';

  onSubmitClick() {
    this.submit();
  }

  submit() {
    if (this.inputValue === '') {
      return;
    }

    this.valueChange.emit(this.inputValue.trim());
  }
}
