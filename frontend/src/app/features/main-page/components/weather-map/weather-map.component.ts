import { AfterViewInit, Component, ElementRef, EventEmitter, Input, NgZone, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import L from 'leaflet';
import { environment } from '../../../../../environments/environment';
import { TranslatePipe } from '../../../ui/shared/pipes/translate.pipe';
import { SelectComponent } from '../select/select.component';

export interface MapFocusLocation {
  lat: number;
  lon: number;
  flyTo: boolean;
}

// Грузим напрямую из main, а не из своей сборки — так данные ветра
// обновляются на лету, без пересборки и передеплоя приложения.
const WIND_DATA_URL = 'https://raw.githubusercontent.com/dreamyhead/weather-2.0/main/frontend/public/assets/wind/wind-global.json';

@Component({
    selector: 'weather-map',
    templateUrl: './weather-map.component.html',
    styleUrls: ['./weather-map.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [TranslatePipe, SelectComponent]
})
export class WeatherMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() focusLocation: MapFocusLocation | null = null;
  @Output() mapClicked = new EventEmitter<{ lat: number; lon: number }>();

  @ViewChild('mapContainer') mapContainerRef?: ElementRef<HTMLDivElement>;
  private mapResizeObserver?: ResizeObserver;

  private map: L.Map | undefined;
  private weatherLayer: L.TileLayer | undefined;
  private velocityLayer: L.Layer | undefined;
  private windData?: unknown[];
  private windZoomHandlersBound = false;
  private currentMarker?: L.Marker;

  layerMode = 'temp_new';
  layerModes: { key: string; value: string }[] = [
    { key: 'clouds_new', value: 'layerClouds' },
    { key: 'temp_new', value: 'layerTemperature' },
    { key: 'precipitation_new', value: 'layerPrecipitation' },
    { key: 'pressure_new', value: 'layerPressure' },
    { key: 'wind_new', value: 'layerWind' }
  ];

  private readonly defaultCoords: [number, number] = [55.7558, 37.6176];

  constructor(
    private http: HttpClient,
    private ngZone: NgZone
  ) {
  }

  ngAfterViewInit() {
    this.initMap(...this.defaultCoords);

    if (typeof ResizeObserver !== 'undefined' && this.mapContainerRef) {
      this.mapResizeObserver = new ResizeObserver(() => {
        this.map?.invalidateSize();
      });
      this.mapResizeObserver.observe(this.mapContainerRef.nativeElement);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!changes['focusLocation'] || !this.focusLocation || !this.map) {
      return;
    }

    const { lat, lon, flyTo } = this.focusLocation;
    if (flyTo) {
      this.map.flyTo([lat, lon], 12, { duration: 1 });
    }
    this.placeMarker(lat, lon);
  }

  ngOnDestroy() {
    this.mapResizeObserver?.disconnect();
  }

  changeMode(layerMode: string) {
    this.layerMode = layerMode;
    this.updateWeatherLayer();
  }

  private placeMarker(lat: number, lon: number) {
    const weatherIcon = L.icon({
      iconUrl: 'assets/icons/point.png',
      iconSize: [32, 32],
    });

    if (this.currentMarker) {
      this.map?.removeLayer(this.currentMarker);
    }
    this.currentMarker = L.marker([lat, lon], { icon: weatherIcon }).addTo(this.map!);
  }

  private initMap(lat: number, lon: number): void {
    this.map = L.map(this.mapContainerRef!.nativeElement, {
      center: [lat, lon],
      zoom: 13,
      minZoom: 3,
      fadeAnimation: false,
      maxBounds: L.latLngBounds([-90, -Infinity], [90, Infinity]),
      maxBoundsViscosity: 1.0
    });

    this.placeMarker(lat, lon);

    this.map.on('click', (event: L.LeafletMouseEvent) => {
      this.mapClicked.emit({ lat: event.latlng.lat, lon: event.latlng.lng });
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© OpenStreetMap',
      className: 'wx-base-tiles',
      keepBuffer: 0
    }).addTo(this.map);

    this.updateWeatherLayer();
  }

  private updateWeatherLayer(): void {
    if (!this.map) {
      return;
    }

    if (this.weatherLayer) {
      this.map.removeLayer(this.weatherLayer);
      this.weatherLayer = undefined;
    }

    this.enableWindAnimation();

    if (this.layerMode === 'wind_new') {
      return;
    }

    const url = `https://tile.openweathermap.org/map/${this.layerMode}/{z}/{x}/{y}.png?appid=${environment.openWeatherApiKey}`;
    this.weatherLayer = L.tileLayer(url, {
      maxZoom: 18,
      attribution: 'Map data © OpenWeatherMap',
      className: 'wx-weather-tiles',
      keepBuffer: 0
    }).addTo(this.map);
  }

  private async enableWindAnimation(): Promise<void> {
    if (this.velocityLayer) {
      return;
    }

    (window as unknown as { L: typeof L }).L = L;
    await import('leaflet-velocity');

    if (!this.windData) {
      this.windData = await firstValueFrom(
        this.http.get<unknown[]>(WIND_DATA_URL)
      );
    }

    if (!this.map || this.velocityLayer) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      this.velocityLayer = (L as unknown as { velocityLayer: (opts: unknown) => L.Layer }).velocityLayer({
        displayValues: true,
        displayOptions: {
          velocityType: 'Wind',
          position: 'bottomleft',
          emptyString: '—',
          angleConvention: 'bearingCW',
          speedUnit: 'ms',
        },
        data: this.windData,
        velocityScale: 0.005,
        opacity: 0.97,
        lineWidth: 1.5,
        particleMultiplier: 1 / 280,
      }).addTo(this.map!);

      this.fadeWindDuringZoom();
    });
  }

  private fadeWindDuringZoom(): void {
    if (!this.map || this.windZoomHandlersBound) {
      return;
    }
    this.windZoomHandlersBound = true;

    const setOpacity = (value: string) => {
      const canvas = this.map?.getContainer().querySelector<HTMLElement>('.velocity-overlay');
      if (canvas) {
        canvas.style.opacity = value;
      }
    };
    this.map.on('zoomstart', () => setOpacity('0'));
    this.map.on('zoomend', () => setOpacity(''));
  }
}
