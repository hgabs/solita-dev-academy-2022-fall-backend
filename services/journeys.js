const pool = require('../db');
const format = require('pg-format');

const isArrayOfNumbers = (value) => value.split(',').every(i => !isNaN(Number(i)));
const base = (countQuery = false) => async (reqParams) => {
  const {
    id = null,
    keyword = null,
    limit = 5,
    page = 1,
    date = null,
    field = null,
    sort = null,
    filter = null,
    operator = null,
    value = '' } = reqParams;

  let args = [], sortStatement = '', filterStatement = '', byIdStatement = '', dateStatement = '', limitStatement = '';
  const isSorting = field && sort;
  const isFiltering = filter && operator || date;

  if (id) {
    byIdStatement = "WHERE (%s = %s OR %s = %s) ";
    args = args.concat(['departure_station_id', id, 'arrival_station_id', id]);
  }

  if (isFiltering) {
    let convertedOperator, patternValue, filterCorrected;
    switch (operator) {
      case 'contains':
        convertedOperator = 'ILIKE';
        patternValue = "'%%%s%%'";
        break;
      case 'equals':
      case '=':
      case 'is':
        convertedOperator = '=';
        patternValue = isNaN(value) ? "'%s'" : '%s';
        break;
      case 'startsWith':
        convertedOperator = 'ILIKE';
        patternValue = "'%s%%'";
        break;
      case 'endsWith':
        convertedOperator = 'ILIKE';
        patternValue = "'%%%s'";
        break;
      case 'isEmpty':
        convertedOperator = 'IS NULL'
        patternValue = '';
        break;
      case 'isNotEmpty':
        convertedOperator = 'IS NOT NULL'
        patternValue = '';
        break;
      case 'isAnyOf':
        if (!isArrayOfNumbers(value)) {
          convertedOperator = 'ILIKE ANY';
        } else {
          convertedOperator = '= ANY';
        }
        patternValue = '(\'{%s}\')'
        break;
      case '!=':
      case 'not':
        convertedOperator = '!=';
        patternValue = '%s';
        break;
      case '<':
      case 'before':
        convertedOperator = '<';
        patternValue = '%s';
        break;
      case '>':
      case 'after':
        convertedOperator = '>';
        patternValue = '%s';
        break;
      case '<=':
      case 'onOrBefore':
        convertedOperator = '<=';
        patternValue = '%s';
        break;
      case '>=':
      case 'onOrAfter':
        convertedOperator = '>=';
        patternValue = '%s';
        break;
    }


    if (filter) {
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
        case 'departure_time':
          filterCorrected = 'j.departure';
          patternValue = '%L::timestamp';
          break;
        case 'arrival_time':
          filterCorrected = 'j.arrival';
          patternValue = '%L::timestamp';
          break;
        case 'distance':
          filterCorrected = 'j.distance';
          patternValue = '(%s*1000)';
          break;
        case 'duration':
          filterCorrected = 'j.duration';
          patternValue = '(%s*60)';
      }

      const startOrContinue = id ? 'AND' : 'WHERE';
      if (['isEmpty', 'isNotEmpty'].includes(operator)) {
        filterStatement = `${startOrContinue} %s %s `;
        args = args.concat([filterCorrected, convertedOperator]);
      } else if (value) {
        if (operator == 'isAnyOf') {
          filterStatement = isArrayOfNumbers(value)
            ? `${startOrContinue} %s %s ` + patternValue
            : `${startOrContinue} LOWER(%s) %s ` + patternValue;
        } else {
          filterStatement = `${startOrContinue} %s %s ` + patternValue;
        }
        args = args.concat([filterCorrected, convertedOperator, decodeURI(value)]);
      }
    }

    if (date) {
      const startOrContinue = id || filter ? 'AND' : 'WHERE';
      dateStatement = `
        ${startOrContinue} (
          (j.departure BETWEEN (date_trunc('month', '%s'::date))::timestamp AND (date_trunc('month', '%s'::date) + interval '1 month' - interval '1 day')::timestamp)
            AND
          (j.arrival BETWEEN (date_trunc('month', '%s'::date))::timestamp AND (date_trunc('month', '%s'::date) + interval '1 month' - interval '1 day')::timestamp)
      )`;
      args = args.concat([date, date, date, date]);
    }
  }

  if (!countQuery) {
    if (isSorting) {
      sortStatement = 'ORDER BY %I %s';
      args = args.concat([field, sort]);
    } else {
      sortStatement = 'ORDER BY j.id DESC ';
    }

    limitStatement = 'LIMIT %s OFFSET %s';
    args = args.concat([limit, (page - 1) * limit]);
  }


  let select = countQuery ? 'COUNT(*)::int' : `
    j.id AS id,
    des.id AS departure_station_id,
    des.name AS departure_station_name,
    j.departure AS departure_time,
    ars.id AS arrival_station_id,
    ars.name AS arrival_station_name,
    j.arrival AS arrival_time,
    round((j.distance::numeric / 1000),2) AS distance,
    round((j.duration::numeric / 60), 2) AS duration
  `;

  let statement = `
    SELECT
        ${select}
        FROM journeys AS j
    INNER JOIN stations AS des ON des.id = j.departure_station_id
    INNER JOIN stations AS ars ON ars.id = j.arrival_station_id
    ${byIdStatement}
    ${filterStatement}
    ${dateStatement}
    ${sortStatement}
    ${limitStatement}
  `;

  const result = await pool.query(format(statement, ...args));
  return countQuery ? result.rows[0].count : result.rows;
}

const getAll = base(countQuery=false);
const getCount = base(countQuery=true);

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
