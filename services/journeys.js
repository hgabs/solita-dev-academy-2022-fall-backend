const pool = require('../db');


const getAll = async (keyword, limit, offset) => {
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
        LIMIT $1 OFFSET $2`;
    const result = await pool.query(statement, [limit, offset]);
    return await result.rows;
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
    getById
};