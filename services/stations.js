const pool = require('../db');


const getAll = async (limit = 5, offset = 0) => {
    const statement = 'SELECT * FROM stations LIMIT $1 OFFSET $2';
    const result = await pool.query(statement, [limit, offset]);
    return result.rows;
}

const getById = async (id) => {
    const statement = `
        SELECT
            *,
            (SELECT COUNT(*) FROM journeys WHERE departure_station_id = s.id)::int AS departures,
            ((SELECT AVG(distance) FROM journeys WHERE departure_station_id = s.id)/1000)::decimal(7,2)::float AS avg_departure_distance,
            (SELECT COUNT(*) FROM journeys WHERE arrival_station_id = s.id)::int AS arrivals,
            ((SELECT AVG(distance) FROM journeys WHERE arrival_station_id = s.id)/1000)::decimal(7,2)::float AS avg_arrival_distance
        FROM stations AS s
        WHERE id = $1
    `;
    const result = await pool.query(statement, [id]);
    return result.rows[0];
}

const getTopFiveDeparturesFromStation = async (id, date) => {
    let statement,result;
    if (!date) {
        statement = `
            SELECT
                arrival_station_id AS station_id,
                name AS station_name,
                COUNT(*)::int AS departure_count
            FROM journeys
            INNER JOIN stations AS s ON s.id = arrival_station_id
            WHERE departure_station_id = $1
            GROUP BY arrival_station_id, name
            ORDER BY departure_count DESC LIMIT 5;
        `;
        result = await pool.query(statement, [id]);
    } else {
        statement = `
            SELECT
                arrival_station_id AS station_id,
                name AS station_name,
                COUNT(*)::int AS departure_count
            FROM journeys
            INNER JOIN stations AS s ON s.id = arrival_station_id
            WHERE
                departure_station_id = $1
                AND arrival BETWEEN
                    (date_trunc('month', $2::date))::timestamp
                    AND (date_trunc('month', $2::date) + interval '1 month' - interval '1 day')::timestamp
            GROUP BY arrival_station_id, name
            ORDER BY departure_count DESC LIMIT 5;
        `;
        result = await pool.query(statement, [id, date]);
    }

    return result.rows;
}

const getTopFiveArrivalsToStation = async (id, date) => {
    let statement,result;
    if (!date) {
        statement = `
            SELECT
                departure_station_id AS station_id,
                name AS station_name,
                COUNT(*)::int AS arrival_count
            FROM journeys
            INNER JOIN stations AS s ON s.id = departure_station_id
            WHERE arrival_station_id = $1
            GROUP BY departure_station_id, name
            ORDER BY arrival_count DESC LIMIT 5;
        `;
        result = await pool.query(statement, [id]);
    } else {
        statement = `
            SELECT
                departure_station_id AS station_id,
                name AS station_name,
                COUNT(*)::int AS arrival_count
            FROM journeys
            INNER JOIN stations AS s ON s.id = departure_station_id
            WHERE arrival_station_id = $1
                AND departure BETWEEN
                    (date_trunc('month', $2::date))::timestamp
                    AND (date_trunc('month', $2::date) + interval '1 month' - interval '1 day')::timestamp
            GROUP BY departure_station_id, name
            ORDER BY arrival_count DESC LIMIT 5;
        `;
        result = await pool.query(statement, [id, date]);
    }


    return result.rows;
}


module.exports = {
    getAll,
    getById,
    getTopFiveDeparturesFromStation,
    getTopFiveArrivalsToStation,
};
