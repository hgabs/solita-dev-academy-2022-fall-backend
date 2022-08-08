const path = require('path');
const fs = require('fs');
const util = require('util');
const pool = require('../db');
const format = require('pg-format');
const { parse } = require('@fast-csv/parse');


const DEPARTURE_TIME_KEY = 0;
const ARRIVAL_TIME_KEY = 1;
const DEPARTURE_STATION_ID_KEY = 2;
const DEPARTURE_STATION_NAME_KEY = 3;
const ARRIVAL_STATION_KEY = 4;
const COVERED_DISTANCE_KEY = 6;
const DURATION_KEY = 7;

const stationHeaders = ['id', 'name'];
const journeyHeaders = ['departure', 'arrival', 'departure_station_id',
  'arrival_station_id', 'distance', 'duration'];

const csvFilesPath = path.resolve(__dirname, '..', 'data');
let stations = [], stationIds = [], journeyCount = 0;
let validatedJourneys = [];

const readdir = util.promisify(fs.readdir);

const getCSVfiles = async () => {
  try {
    const csvFiles = await readdir(csvFilesPath);
    return csvFiles.reduce((acc, curr) => {
      const parsedFilePath = path.parse(curr);
      if (parsedFilePath.ext.toLocaleLowerCase() == '.csv')
        acc.push(parsedFilePath.base);
      return acc;
    }, []);
  } catch (error) {
    if (error.code == 'ENOENT')
      throw `[-] Error: Directory "${error.path}" does not exists. \n`;
    throw error;
  }
}

const csvRowValidator = row => {
  const validDuration = row[DURATION_KEY] >= 10;
  const validCoveredDistance = row[COVERED_DISTANCE_KEY] >= 10;
  return validDuration && validCoveredDistance;
}

const processValidatedRow = (row, stationIds, stations, validatedJourneys) => {
  const currentStationId = row[DEPARTURE_STATION_ID_KEY];
  const currentStationName = row[DEPARTURE_STATION_NAME_KEY];

  if (!stationIds.includes(currentStationId)) {
    stations.push({ id: currentStationId, name: currentStationName });
    stationIds.push(currentStationId);
  }

  journeyCount++;
  validatedJourneys.push({
    'departure': row[DEPARTURE_TIME_KEY],
    'arrival': row[ARRIVAL_TIME_KEY],
    'departure_station_id': row[DEPARTURE_STATION_ID_KEY],
    'arrival_station_id': row[ARRIVAL_STATION_KEY],
    'distance': row[COVERED_DISTANCE_KEY],
    'duration': row[DURATION_KEY]
  });
}

const processCSVfile = (csvFile) => {
  return new Promise((resolve, reject) => {
    let invalidRows = [];
    const startTime = new Date();
    fs.createReadStream(csvFilesPath + '/' + csvFile)
      .pipe(parse({ headers: false, skipRows: 1, separator: ',' }))
      .validate(csvRowValidator)
      .on('error', error => reject(error))
      .on('data-invalid', (row, rowNumber) => invalidRows.push(row))
      .on('data', data => processValidatedRow(data, stationIds, stations, validatedJourneys))
      .on('end', () => {
        const endTime = new Date();
        console.log('[+] Processed', csvFile, `with ${validatedJourneys.length} out of`,
          `${validatedJourneys.length + invalidRows.length} valid journeys (${(endTime - startTime) / 1000} sec).`);
        resolve('');
      });
  })
};

const saveToDB = async (relation, headers, data) => {
  let rows = [], currentRow = [];
  for (let i = 0; i < data.length; i++) {
    headers.forEach(header => currentRow.push(data[i][header]));
    rows.push(currentRow);
    const rowLimitReached = i % 1000 == 0;
    const lastRow = i == data.length - 1;
    if (rowLimitReached || lastRow) {
      const statement = format('INSERT INTO %s (%s) VALUES %L', relation, headers, rows);
      await pool.query(statement);
      rows = [];
    }
    currentRow = [];
  }
}

(async () => {
  try {
    console.log();
    const csvFiles = await getCSVfiles();
    console.log('[*] Processing CSV files:', csvFiles.join(', '));
    await Promise.all(csvFiles.map(file => {
      return processCSVfile(file);
    }));

    const startTime = new Date();
    console.log('[*] Saving data to databases...');
    await saveToDB('stations', stationHeaders, stations);
    await saveToDB('journeys', journeyHeaders, validatedJourneys);
    const endTime = new Date();
    console.log(`[+] Data successfully saved to database (${(endTime - startTime) / 1000} sec).`)
    await pool.end();
    console.log(`[+] Total of ${stationIds.length} stations and ${journeyCount} valid journeys.`);
  } catch (error) {
    console.log(error);
  }
})();
