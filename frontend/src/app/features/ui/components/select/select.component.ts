import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss']
})
export class SelectComponent {
  @Output() 
  optionSelected = new EventEmitter<string>();

  @Input() 
  title?: string;

  @Input() 
  options?: any[];

  selectedOption?: any;
  dropdownOpen: boolean = false;

  ngOnInit() {
    this.selectedOption = this.options?.find((option) => this.title === option.key);
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  selectOption(event: Event, option: any) {
    event.stopPropagation();
    this.selectedOption = option;
    this.dropdownOpen = false;
    this.optionSelected.emit(option.key); // Emit the selected option to the parent component
  }
}
