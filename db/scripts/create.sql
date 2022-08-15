DROP TABLE IF EXISTS stations CASCADE;

CREATE TABLE IF NOT EXISTS stations (
    id INT NOT NULL,
    name VARCHAR(255) NOT NULL
);

ALTER TABLE stations ADD CONSTRAINT pk_stations PRIMARY KEY (id);
CREATE INDEX ON stations (name);

CREATE TABLE IF NOT EXISTS journeys (
    id SERIAL,
    departure TIMESTAMP NOT NULL,
    arrival TIMESTAMP NOT NULL,
    departure_station_id INT NOT NULL,
    arrival_station_id INT NOT NULL,
    distance NUMERIC NOT NULL,
    duration INT NOT NULL
);

ALTER TABLE journeys ADD CONSTRAINT pk_journeys PRIMARY KEY (id);

ALTER TABLE journeys ADD CONSTRAINT fk_journeys_stations_depature_station_id FOREIGN KEY (departure_station_id) REFERENCES stations (id);
ALTER TABLE journeys ADD CONSTRAINT fk_journeys_stations_arrival_station_id FOREIGN KEY (arrival_station_id) REFERENCES stations (id);

CREATE INDEX ON journeys (departure);
CREATE INDEX ON journeys (arrival);
CREATE INDEX ON journeys (distance);
CREATE INDEX ON journeys (duration);
