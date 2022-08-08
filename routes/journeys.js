const express = require('express');
const journeyRouter = express.Router();
const journeyService = require('../services/journeys.js');


journeyRouter.get('/journeys', async (req, res, next) => {
    try {
        const { keyword = '', limit = 5, offset = 0 } = req.query;
        const journeys = await journeyService.getAll(keyword, limit, offset);
        return res.status(200).send(journeys);    
    } catch (error) {
        console.log(error);
        return res.status(500).end();
    }
});

journeyRouter.get('/journeys/:id', async (req, res, next) => {
    try {
        const journey = await journeyService.getById(req.params.id);
        if (journey) return res.status(200).json(journey);
        return res.status(404).end();
    } catch (error) {
        console.log(error);
        return res.status(500).end();
    }
})

module.exports = journeyRouter;
