const pool = require('../db');
const format = require('pg-format');


const getAll = async (reqParams) => {
  const {
    id = null,
    keyword = null,
    limit = 5,
    page = 1,
    field = null,
    sort = null,
    filter = null,
    operator = null,
    value = null } = reqParams;

  let args = [], sortStatement = '', filterStatement = '', byIdStatement = '';
  const isSorting = field && sort;
  const isFiltering = filter && operator && value;

  if (id) {
    byIdStatement = "WHERE (%s = %s OR %s = %s) ";
    args = args.concat(['departure_station_id', id, 'arrival_station_id', id]);
  }

  if (isFiltering) {
    let convertedOperator, patternValue, filterCorrected;
    switch (operator) {
      case 'equals':
        convertedOperator = '=';
        patternValue = '%s';
        break;
      case 'contains':
        convertedOperator = 'ILIKE';
        patternValue = '%%%s%%';
        break;
      case 'startsWith':
        convertedOperator = 'ILIKE'
        patternValue = '%s%%';
        break;
      case 'endsWith':
        convertedOperator = 'ILIKE'
        patternValue = '%%%s';
        break;
    }

    switch (filter) {
      case 'id':
        filterCorrected = 'j.id';
        break;
      case 'departure_station_name':
        filterCorrected = 'des.name';
        break;
      case 'arrival_station_name':
        filterCorrected = 'ars.name';
        break;
      case 'distance':
        filterCorrected = 'j.distance';
        break;
      case 'duration':
        filterCorrected = 'j.duration';
    }

    filterStatement = id ? `AND %s %s '${patternValue}' ` : `WHERE %s %s '${patternValue}' `;
    args = args.concat([filterCorrected, convertedOperator, decodeURI(value)]);
  }

  if (isSorting) {
    sortStatement = 'ORDER BY %I %s';
    args = args.concat([field, sort]);
  } else {
    sortStatement = 'ORDER BY j.id DESC ';
  }

  args = args.concat([limit, (page - 1) * limit]);
  let statement = format(`
        SELECT
            j.id AS id,
            des.id AS departure_station_id,
            des.name AS departure_station_name,
            j.departure AS departure_time,
            ars.id AS arrival_station_id,
            ars.name AS arrival_station_name,
            j.arrival AS arrival_time,
            round((j.distance::numeric / 1000),2) AS distance,
            round((j.duration::numeric / 60), 2) AS duration
        FROM journeys AS j
        INNER JOIN stations AS des ON des.id = j.departure_station_id
        INNER JOIN stations AS ars ON ars.id = j.arrival_station_id
        ${byIdStatement}
        ${filterStatement}
        ${sortStatement}
        LIMIT %s OFFSET %s
    `, ...args);

  const result = await pool.query(statement);
  return result.rows;
}

const getCount = async (reqQueryParams) => {
  const {
    limit,
    page,
    keyword = null,
    filter = null,
    operator = null,
    value = null,
    id } = reqQueryParams;
  let statement, args = [], filterStatement = '', byIdStatement = '', result;
  const isFiltering = filter && operator && value;

  if (id) {
    byIdStatement = "WHERE (%s = %s OR %s = %s) ";
    args = args.concat(['departure_station_id', id, 'arrival_station_id', id]);
  }

  if (isFiltering) {
    let convertedOperator, patternValue, filterCorrected;
    switch (operator) {
      case 'contains':
        convertedOperator = 'ILIKE';
        patternValue = '%%%s%%';
        break;
      case 'startsWith':
        convertedOperator = 'ILIKE'
        patternValue = '%s%%';
        break;
      case 'endsWith':
        convertedOperator = 'ILIKE'
        patternValue = '%%%s';
        break;
      case 'equals':
        convertedOperator = '='
        patternValue = '%s';
        break;
    }

    switch (filter) {
      case 'id':
        filterCorrected = 'j.id';
        break;
      case 'departure_station_name':
        filterCorrected = 'des.name';
        break;
      case 'arrival_station_name':
        filterCorrected = 'ars.name';
        break;
      case 'distance':
        filterCorrected = 'j.distance';
        break;
      case 'duration':
        filterCorrected = 'j.duration';
    }

    filterStatement = id ? `AND %s %s '${patternValue}' ` : `WHERE %s %s '${patternValue}' `;
    args = args.concat([filterCorrected, convertedOperator, decodeURI(value)]);

    statement = format(`
      SELECT COUNT(*)
      FROM journeys AS j
      INNER JOIN stations AS des ON des.id = j.departure_station_id
      INNER JOIN stations AS ars ON ars.id = j.arrival_station_id
      ${byIdStatement} ${filterStatement}
    `, ...args);

  } else {
    statement = format(`SELECT COUNT(*)::int FROM journeys ${byIdStatement}`, ...args);
  }

  result = await pool.query(statement);
  return result.rows[0].count;
}

const getById = async (id) => {
  const statement = `
        SELECT
            des.id AS departure_station_id,
            des.name AS departure_station_name,
            j.departure AS departure_time,
            ars.id AS arrival_station_id,
            ars.name AS arrival_station_name,
            j.arrival AS arrival_time,
            (j.distance / 1000)::decimal(10,2)::float AS distance,
            (j.duration / 60) AS duration
        FROM journeys AS j
        INNER JOIN stations AS des ON des.id = j.departure_station_id
        INNER JOIN stations AS ars ON ars.id = j.arrival_station_id
        WHERE j.id = $1
    `;
  const result = await pool.query(statement, [id]);
  return result.rows[0];
}


module.exports = {
  getAll,
  getCount,
  getById
};
