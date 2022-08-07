CREATE TABLE IF NOT EXISTS stations (
    id INT NOT NULL,
    name VARCHAR(255) NOT NULL
);

ALTER TABLE stations ADD CONSTRAINT pk_stations PRIMARY KEY (id);

CREATE TABLE IF NOT EXISTS journeys (
    id SERIAL,
    departure TIMESTAMP NOT NULL,
    arrival TIMESTAMP NOT NULL,
    departure_station_id INT NOT NULL,
    arrival_station_id INT NOT NULL,
    distance NUMERIC NOT NULL,
    duration INT NOT NULL
);

ALTER TABLE journeys ADD CONSTRAINT fk_journeys_stations_depature_station_id FOREIGN KEY (departure_station_id) REFERENCES stations (id);
ALTER TABLE journeys ADD CONSTRAINT fk_journeys_stations_arrival_station_id FOREIGN KEY (arrival_station_id) REFERENCES stations (id);
