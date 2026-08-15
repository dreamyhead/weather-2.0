import { Component, Input } from '@angular/core';
import { NgStyle } from '@angular/common';

@Component({
    selector: 'app-loader',
    templateUrl: './loader.component.html',
    styleUrls: ['./loader.component.scss'],
    standalone: true,
    imports: [NgStyle]
})
export class LoaderComponent {

  @Input()
  color?: string;

}
