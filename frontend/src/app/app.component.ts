import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AppBarComponent } from './features/main-page/components/app-bar/app-bar.component';
import { MainPageComponent } from './features/main-page/main-page.component';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [AppBarComponent, MainPageComponent]
})
export class AppComponent {
}
