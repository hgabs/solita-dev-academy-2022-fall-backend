const express = require('express');
const stationRouter = express.Router();
const stationService = require('../services/stations.js');
const paginate = require('../middlewares/paginate');


stationRouter.get('/stations', paginate('station'), async (req, res, next) => {
    try {
        return res.status(200).json(req.paginatedResults);
    } catch (error) {
        console.log(error);
        return res.status(500).end();
    }
});

stationRouter.get('/stations/:id', async (req, res, next) => {
    try {
        const station = await stationService.getById(req.params.id);
        if (station) return res.status(200).json(station);
        return res.status(404).end();
    } catch (error) {
        console.log(error);
        return res.status(500).end();
    }
});

stationRouter.get('/stations/:id/departures', async (req, res, next) => {
    try {
        const id = req.params.id;
        const date = req.query.date;
        const station = await stationService.getTopFiveDeparturesFromStation(id, date);
        if (station) return res.status(200).json(station);
        return res.status(404).end();
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
});

stationRouter.get('/stations/:id/arrivals', async (req, res, next) => {
    try {
        const id = req.params.id;
        const date = req.query.date;
        const station = await stationService.getTopFiveArrivalsToStation(id, date);
        if (station) return res.status(200).json(station);
        return res.status(404).end();
    } catch (error) {
        console.error(error);
        return res.status(500).end();
    }
});


module.exports = stationRouter;
