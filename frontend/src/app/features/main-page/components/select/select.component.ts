import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgFor } from '@angular/common';
import { TranslatePipe } from '../../../ui/shared/pipes/translate.pipe';

@Component({
    selector: 'app-select',
    templateUrl: './select.component.html',
    styleUrls: ['./select.component.scss'],
    standalone: true,
    imports: [NgFor, TranslatePipe]
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
    this.optionSelected.emit(option.key);
  }
}
