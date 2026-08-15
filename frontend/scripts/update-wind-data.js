#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { GribMessageFactory } = require('@mattnucc/gribberish');

const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'assets', 'wind', 'wind-global.json');
const RUN_HOURS = ['18', '12', '06', '00'];

function pad(n) {
  return String(n).padStart(2, '0');
}

function gfsDateDir(date) {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`;
}

async function findLatestRun() {
  for (const daysBack of [0, 1]) {
    const date = new Date(Date.now() - daysBack * 86400000);
    const dir = gfsDateDir(date);

    for (const hour of RUN_HOURS) {
      const url = `https://nomads.ncep.noaa.gov/pub/data/nccf/com/gfs/prod/gfs.${dir}/${hour}/atmos/gfs.t${hour}z.pgrb2.1p00.f000`;
      const res = await fetch(url, { method: 'HEAD' });
      if (res.ok) {
        return { dir, hour };
      }
    }
  }
  throw new Error('Не нашёл ни одного готового прогона GFS за последние двое суток');
}

async function downloadWindGrib(dir, hour) {
  const params = new URLSearchParams({
    dir: `/gfs.${dir}/${hour}/atmos`,
    file: `gfs.t${hour}z.pgrb2.1p00.f000`,
    var_UGRD: 'on',
    var_VGRD: 'on',
    lev_10_m_above_ground: 'on',
    subregion: '',
    leftlon: '0',
    rightlon: '360',
    toplat: '90',
    bottomlat: '-90'
  });
  const url = `https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_1p00.pl?${params}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Не удалось скачать GRIB2 (${res.status}): ${url}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

function buildRecord(msg, parameterNumber, parameterUnit) {
  const { latitude, longitude } = msg.latlngAdjusted(false, true);
  const data = msg.dataAdjusted(false, true).map((v) => Math.round(v * 100) / 100);

  return {
    header: {
      parameterCategory: 2,
      parameterNumber,
      parameterUnit,
      nx: longitude.length,
      ny: latitude.length,
      lo1: longitude[0],
      la1: latitude[0],
      lo2: longitude[longitude.length - 1],
      la2: latitude[latitude.length - 1],
      dx: Math.abs(longitude[1] - longitude[0]),
      dy: Math.abs(latitude[1] - latitude[0]),
      scanMode: 0,
      refTime: msg.referenceDate.toISOString(),
      forecastTime: 0
    },
    data
  };
}

async function main() {
  console.log('Ищу последний готовый прогон GFS...');
  const { dir, hour } = await findLatestRun();
  console.log(`Нашёл: gfs.${dir} ${hour}z — качаю U/V ветра на 10м...`);

  const grib = await downloadWindGrib(dir, hour);
  console.log(`Скачано ${(grib.length / 1024).toFixed(0)} КБ, парсю...`);

  const factory = GribMessageFactory.fromBuffer(grib);
  const keys = factory.availableMessages;
  const uKey = keys.find((k) => k.startsWith('UGRD'));
  const vKey = keys.find((k) => k.startsWith('VGRD'));
  if (!uKey || !vKey) {
    throw new Error(`В файле не нашлось U/V компонент ветра. Сообщения: ${keys.join(', ')}`);
  }

  const uMsg = factory.getMessage(uKey);
  const vMsg = factory.getMessage(vKey);
  const result = [
    buildRecord(uMsg, 2, uMsg.units),
    buildRecord(vMsg, 3, vMsg.units)
  ];

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(result));
  console.log(`Готово: ${OUTPUT_PATH} (прогон ${dir} ${hour}z, ${uMsg.gridShape.rows}x${uMsg.gridShape.cols})`);
}

main().catch((err) => {
  console.error('Обновление данных ветра не удалось:', err.message);
  process.exit(1);
});
