# Weather 2.0

Погодное PWA-приложение на Angular: текущая погода и прогноз по городу, карта с погодными слоями (температура, осадки, ветер, давление, облачность) и график температуры.

## Возможности

- Поиск текущей погоды и прогноза по названию города
- Интерактивная карта (Leaflet) с переключаемыми погодными слоями от OpenWeatherMap
- График температуры на 1 день / 4 дня
- Тёмная тема
- Локализация (RU / EN)

## Стек

Angular · TypeScript · RxJS · Leaflet · SCSS

## Запуск локально

Проект лежит в `frontend/`.

```bash
cd frontend
npm install
```

Приложению нужен свой ключ [OpenWeatherMap API](https://openweathermap.org/api) (бесплатный тариф подходит):

```bash
cp src/environments/environment.example.ts src/environments/environment.ts
cp src/environments/environment.example.ts src/environments/environment.development.ts
```

и вписать свой ключ в поле `openWeatherApiKey` в обоих файлах. Эти файлы в `.gitignore` — ключ не попадёт в git.

```bash
npm start
```

Приложение поднимется на `http://localhost:4200`.

## Сборка

```bash
npm run build
```

Артефакты соберутся в `dist/`.
